<?php

namespace App\Modules\Tasks\Services;

use App\Modules\Tasks\Models\Task;
use App\Modules\Tasks\Models\TaskAssignment;
use App\Modules\Tasks\Models\TaskAttachment;
use App\Modules\Tasks\Models\TaskCc;
use App\Modules\Tasks\Models\TaskNotificationQueue;
use App\Modules\Tasks\Models\TaskReminder;
use App\Modules\Tasks\Models\TaskUpdate;
use App\Services\AuditLogger;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TaskService
{
    public function listTasks(int $institutionId, array $filters = [])
    {
        $query = Task::query()
            ->where('institution_id', $institutionId)
            ->with(['category', 'assignments.user', 'attachments']);

        if (! empty($filters['status']) && $filters['status'] !== 'All') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['priority']) && $filters['priority'] !== 'All') {
            $query->where('priority', $filters['priority']);
        }

        if (! empty($filters['category_id']) && $filters['category_id'] !== 'All') {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['search'])) {
            $query->where('title', 'like', '%'.$filters['search'].'%');
        }

        if (! empty($filters['schedule_later']) && filter_var($filters['schedule_later'], FILTER_VALIDATE_BOOLEAN)) {
            $query->where('is_scheduled', true);
        }

        return $query->latest()->paginate((int) ($filters['per_page'] ?? 20));
    }

    public function createTask(int $institutionId, int $creatorId, array $payload)
    {
        return DB::transaction(function () use ($institutionId, $creatorId, $payload) {
            $scheduleTimes = array_values(array_filter((array) ($payload['schedules'] ?? [])));
            $isScheduled = ! empty($payload['schedule_later']) && count($scheduleTimes) > 0;

            $task = Task::create([
                'institution_id' => $institutionId,
                'title' => $payload['title'],
                'description' => $payload['description'] ?? null,
                'priority' => $payload['priority'] ?? 'Medium',
                'start_date' => $payload['start_date'] ?? null,
                'start_time' => $payload['start_time'] ?? null,
                'deadline' => $payload['deadline'] ?? null,
                'deadline_time' => $payload['deadline_time'] ?? null,
                'status' => $isScheduled ? 'Scheduled' : 'Pending',
                'created_by' => $creatorId,
                'category_id' => $payload['category_id'] ?? null,
                'notification_template' => $payload['notification_template'] ?? null,
                'schedules_json' => ! empty($scheduleTimes) ? json_encode($scheduleTimes) : null,
                'is_scheduled' => $isScheduled,
                'color' => $payload['color'] ?? null,
            ]);

            $assignments = $this->syncAssignments($task, (array) ($payload['assignee_ids'] ?? []), true);
            $this->syncCc($task->id, (array) ($payload['cc_user_ids'] ?? []));
            $this->syncReminders($task->id, (array) ($payload['reminder_times'] ?? []));

            if ($isScheduled) {
                $this->queueNotifications($task->id, $assignments, $scheduleTimes);
            }

            if (! empty($payload['source_files']) && is_array($payload['source_files'])) {
                foreach ($payload['source_files'] as $file) {
                    if ($file instanceof UploadedFile) {
                        $this->storeTaskAttachment($task->id, null, $file, 'source');
                    }
                }
            }

            AuditLogger::log(
                $institutionId,
                'task.created',
                Task::class,
                $task->id,
                $creatorId,
                null,
                ['title' => $task->title, 'status' => $task->status]
            );

            return $task->fresh(['category', 'assignments.user', 'attachments', 'reminders']);
        });
    }

    public function updateTask(Task $task, array $payload)
    {
        return DB::transaction(function () use ($task, $payload) {
            $task->fill([
                'title' => $payload['title'] ?? $task->title,
                'description' => $payload['description'] ?? $task->description,
                'priority' => $payload['priority'] ?? $task->priority,
                'start_date' => array_key_exists('start_date', $payload) ? ($payload['start_date'] ?: null) : $task->start_date,
                'start_time' => array_key_exists('start_time', $payload) ? ($payload['start_time'] ?: null) : $task->start_time,
                'deadline' => array_key_exists('deadline', $payload) ? ($payload['deadline'] ?: null) : $task->deadline,
                'deadline_time' => array_key_exists('deadline_time', $payload) ? ($payload['deadline_time'] ?: null) : $task->deadline_time,
                'category_id' => array_key_exists('category_id', $payload) ? ($payload['category_id'] ?: null) : $task->category_id,
                'notification_template' => array_key_exists('notification_template', $payload) ? $payload['notification_template'] : $task->notification_template,
                'color' => array_key_exists('color', $payload) ? $payload['color'] : $task->color,
            ]);

            $scheduleTimes = array_values(array_filter((array) ($payload['schedules'] ?? [])));
            $isScheduled = ! empty($payload['schedule_later']) && count($scheduleTimes) > 0;
            $task->is_scheduled = $isScheduled;
            $task->status = $isScheduled ? 'Scheduled' : $task->status;
            $task->schedules_json = ! empty($scheduleTimes) ? json_encode($scheduleTimes) : null;
            $task->save();

            $assignments = $this->syncAssignments($task, (array) ($payload['assignee_ids'] ?? []), false);

            if (array_key_exists('cc_user_ids', $payload)) {
                $this->syncCc($task->id, (array) $payload['cc_user_ids']);
            }

            if (array_key_exists('reminder_times', $payload)) {
                $this->syncReminders($task->id, (array) $payload['reminder_times']);
            }

            if ($isScheduled) {
                TaskNotificationQueue::where('task_id', $task->id)->where('status', 'pending')->delete();
                $this->queueNotifications($task->id, $assignments, $scheduleTimes);
            }

            AuditLogger::log(
                (int) $task->institution_id,
                'task.updated',
                Task::class,
                $task->id,
                (int) auth()->id(),
                null,
                ['title' => $task->title, 'status' => $task->status]
            );

            return $task->fresh(['category', 'assignments.user', 'attachments', 'reminders']);
        });
    }

    public function deleteTask(Task $task): void
    {
        AuditLogger::log(
            (int) $task->institution_id,
            'task.deleted',
            Task::class,
            $task->id,
            (int) auth()->id(),
            ['title' => $task->title],
            null
        );

        $task->delete();
    }

    public function getTaskDetails(int $institutionId, int $taskId)
    {
        return Task::where('institution_id', $institutionId)
            ->with([
                'category',
                'creator:id,name,phone_number,email',
                'assignments.user:id,name,phone_number,email',
                'assignments.updates.attachments',
                'attachments',
                'reminders',
            ])
            ->findOrFail($taskId);
    }

    public function myTasks(int $institutionId, int $userId, array $filters = [])
    {
        $query = TaskAssignment::query()
            ->where('user_id', $userId)
            ->whereHas('task', function ($q) use ($institutionId) {
                $q->where('institution_id', $institutionId);
            })
            ->with(['task.category', 'task.creator:id,name,phone_number,email']);

        if (! empty($filters['status']) && $filters['status'] !== 'All') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['category_id']) && $filters['category_id'] !== 'All') {
            $query->whereHas('task', function ($q) use ($filters) {
                $q->where('category_id', $filters['category_id']);
            });
        }

        return $query->latest()->paginate((int) ($filters['per_page'] ?? 20));
    }

    public function pendingAcceptances(int $institutionId)
    {
        return TaskAssignment::query()
            ->where('status', 'Pending')
            ->whereHas('task', function ($q) use ($institutionId) {
                $q->where('institution_id', $institutionId);
            })
            ->with(['task', 'user:id,name,phone_number,email'])
            ->latest()
            ->paginate(20);
    }

    public function updateAssignmentProgress(int $institutionId, int $assignmentId, int $actorId, array $payload)
    {
        return DB::transaction(function () use ($institutionId, $assignmentId, $actorId, $payload) {
            $assignment = TaskAssignment::query()
                ->where('id', $assignmentId)
                ->where('user_id', $actorId)
                ->whereHas('task', function ($q) use ($institutionId) {
                    $q->where('institution_id', $institutionId);
                })
                ->firstOrFail();

            $progress = (int) ($payload['progress'] ?? $assignment->progress ?? 0);
            $status = $payload['status'] ?? 'In Progress';

            $assignment->progress = max(0, min(100, $progress));
            $assignment->status = $status;
            $assignment->last_update_at = now();
            if ($assignment->progress >= 100 || $status === 'Completed') {
                $assignment->status = 'Completed';
                $assignment->progress = 100;
                $assignment->completed_at = now();
            }
            $assignment->save();

            if (! empty($payload['comment']) || ! empty($payload['attachments'])) {
                $update = TaskUpdate::create([
                    'assignment_id' => $assignment->id,
                    'progress' => $assignment->progress,
                    'comment' => $payload['comment'] ?? 'Progress updated',
                ]);

                if (! empty($payload['attachments']) && is_array($payload['attachments'])) {
                    foreach ($payload['attachments'] as $file) {
                        if ($file instanceof UploadedFile) {
                            $this->storeTaskAttachment($assignment->task_id, $update->id, $file, 'update');
                        }
                    }
                }
            }

            $this->recomputeTaskStatus($assignment->task_id);

            return $assignment->fresh(['task', 'updates.attachments']);
        });
    }

    public function storeTaskAttachment(int $taskId, $updateId, UploadedFile $file, string $type = 'source')
    {
        $filename = Str::random(12).'_'.preg_replace('/\s+/', '_', $file->getClientOriginalName());
        $folder = $updateId ? 'task-attachments/updates' : 'task-attachments/sources';
        $path = $file->storeAs($folder, $filename, 'public');

        return TaskAttachment::create([
            'task_id' => $taskId,
            'update_id' => $updateId,
            'file_name' => $file->getClientOriginalName(),
            'file_url' => $path,
            'attachment_type' => $type,
        ]);
    }

    protected function syncAssignments(Task $task, array $assigneeIds, bool $isCreate): array
    {
        $assigneeIds = array_values(array_unique(array_map('intval', array_filter($assigneeIds))));

        if ($isCreate) {
            $created = [];
            foreach ($assigneeIds as $userId) {
                $created[] = TaskAssignment::create([
                    'task_id' => $task->id,
                    'user_id' => $userId,
                    'status' => 'Pending',
                    'progress' => 0,
                    'last_update_at' => now(),
                    'invite_token' => Str::random(48),
                ]);
            }
            return $created;
        }

        $current = TaskAssignment::where('task_id', $task->id)->get()->keyBy('user_id');

        $toKeep = [];
        foreach ($assigneeIds as $userId) {
            if ($current->has($userId)) {
                $toKeep[] = $current->get($userId);
                continue;
            }

            $toKeep[] = TaskAssignment::create([
                'task_id' => $task->id,
                'user_id' => $userId,
                'status' => 'Pending',
                'progress' => 0,
                'last_update_at' => now(),
                'invite_token' => Str::random(48),
            ]);
        }

        if (! empty($assigneeIds)) {
            TaskAssignment::where('task_id', $task->id)
                ->whereNotIn('user_id', $assigneeIds)
                ->delete();
        } else {
            TaskAssignment::where('task_id', $task->id)->delete();
        }

        return $toKeep;
    }

    protected function syncCc(int $taskId, array $ccUserIds): void
    {
        $ccUserIds = array_values(array_unique(array_map('intval', array_filter($ccUserIds))));

        TaskCc::where('task_id', $taskId)->delete();
        foreach ($ccUserIds as $userId) {
            TaskCc::create([
                'task_id' => $taskId,
                'user_id' => $userId,
            ]);
        }
    }

    protected function syncReminders(int $taskId, array $reminderTimes): void
    {
        TaskReminder::where('task_id', $taskId)->delete();

        $clean = array_values(array_filter($reminderTimes));
        foreach ($clean as $reminderTime) {
            TaskReminder::create([
                'task_id' => $taskId,
                'reminder_time' => $reminderTime,
                'is_sent' => false,
            ]);
        }
    }

    protected function queueNotifications(int $taskId, array $assignments, array $scheduleTimes): void
    {
        foreach ($assignments as $assignment) {
            foreach ($scheduleTimes as $schedule) {
                TaskNotificationQueue::create([
                    'task_id' => $taskId,
                    'assignment_id' => $assignment->id,
                    'scheduled_at' => $schedule,
                    'status' => 'pending',
                ]);
            }
        }
    }

    public function recomputeTaskStatus(int $taskId): void
    {
        $task = Task::find($taskId);
        if (! $task) {
            return;
        }

        $assignments = TaskAssignment::where('task_id', $taskId)->get();
        if ($assignments->isEmpty()) {
            $task->status = 'Pending';
            $task->save();
            return;
        }

        $allCompleted = $assignments->every(function ($a) {
            return $a->status === 'Completed';
        });

        $anyStarted = $assignments->contains(function ($a) {
            return in_array($a->status, ['In Progress', 'Accepted', 'Completed'], true);
        });

        if ($allCompleted) {
            $task->status = 'Completed';
        } elseif ($anyStarted) {
            $task->status = 'In Progress';
        } else {
            $task->status = 'Pending';
        }

        $task->save();
    }
}
