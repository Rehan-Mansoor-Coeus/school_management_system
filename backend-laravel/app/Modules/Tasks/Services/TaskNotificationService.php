<?php

namespace App\Modules\Tasks\Services;

use App\Contracts\Messaging\WhatsAppMessagingProvider;
use App\Institution;
use App\Modules\Tasks\Models\Task;
use App\Modules\Tasks\Models\TaskAssignment;
use App\Modules\Tasks\Models\TaskCc;
use App\Modules\Tasks\Models\TaskNotificationQueue;
use App\Modules\Tasks\Models\TaskReminder;
use App\Services\Messaging\NotificationMessageFormatter;

class TaskNotificationService
{
    protected $whatsApp;

    protected $formatter;

    public function __construct(WhatsAppMessagingProvider $whatsApp)
    {
        $this->whatsApp = $whatsApp;
        $this->formatter = new NotificationMessageFormatter();
    }

    public function getInvite(string $token)
    {
        return TaskAssignment::query()
            ->where('invite_token', $token)
            ->with(['task', 'user:id,name,email,phone_number'])
            ->first();
    }

    public function notifyAssignment(int $institutionId, int $assignmentId, $messageTemplate = null): array
    {
        $assignment = $this->loadAssignmentContext($institutionId, $assignmentId);
        if (! $assignment) {
            return ['success' => false, 'error' => 'Assignment not found'];
        }

        return $this->sendAssignmentMessage($assignment, $messageTemplate);
    }

    public function respondInvite(int $institutionId, int $userId, string $token, string $action): array
    {
        $assignment = TaskAssignment::query()
            ->where('invite_token', $token)
            ->where('user_id', $userId)
            ->whereHas('task', function ($q) use ($institutionId) {
                $q->where('institution_id', $institutionId);
            })
            ->with('task')
            ->first();

        if (! $assignment) {
            return ['success' => false, 'error' => 'Invalid invite token'];
        }

        if (! in_array($action, ['accept', 'decline'], true)) {
            return ['success' => false, 'error' => 'Invalid action'];
        }

        if ($action === 'accept') {
            $assignment->status = 'Accepted';
            $assignment->accepted_at = now();
        } else {
            $assignment->status = 'Declined';
            $assignment->declined_at = now();
        }

        $assignment->last_update_at = now();
        $assignment->save();

        return [
            'success' => true,
            'data' => [
                'action' => $action,
                'task_title' => $assignment->task->title,
                'assignment_id' => $assignment->id,
            ],
        ];
    }

    public function syncOverdue(int $institutionId): array
    {
        $tasks = Task::query()
            ->where('institution_id', $institutionId)
            ->whereNotIn('status', ['Completed', 'Overdue', 'Scheduled'])
            ->whereNotNull('deadline')
            ->get();

        $marked = 0;
        foreach ($tasks as $task) {
            $due = $task->deadline->copy()->setTime(23, 59, 59);
            if (! empty($task->deadline_time)) {
                $parts = explode(':', $task->deadline_time);
                if (count($parts) >= 2) {
                    $due->setTime((int) $parts[0], (int) $parts[1], 0);
                }
            }

            if ($due->lt(now())) {
                $task->status = 'Overdue';
                $task->save();
                $marked++;

                TaskAssignment::where('task_id', $task->id)
                    ->whereNotIn('status', ['Completed', 'Declined', 'Overdue'])
                    ->update(['status' => 'Overdue']);
            }
        }

        return ['success' => true, 'data' => ['marked_overdue' => $marked]];
    }

    public function processScheduled(int $institutionId): array
    {
        $rows = TaskNotificationQueue::query()
            ->where('status', 'pending')
            ->where('scheduled_at', '<=', now())
            ->whereHas('task', function ($q) use ($institutionId) {
                $q->where('institution_id', $institutionId);
            })
            ->with(['task', 'assignment.user'])
            ->orderBy('scheduled_at')
            ->limit(50)
            ->get();

        $sent = 0;
        $failed = 0;

        foreach ($rows as $queue) {
            $result = $this->sendAssignmentMessage($queue->assignment, $queue->task->notification_template);
            if ($result['success']) {
                $queue->status = 'sent';
                $queue->sent_at = now();
                $sent++;
            } else {
                $queue->status = 'failed';
                $queue->last_error = $result['error'];
                $failed++;
            }
            $queue->save();
        }

        return ['success' => true, 'data' => ['processed' => $rows->count(), 'sent' => $sent, 'failed' => $failed]];
    }

    public function processReminders(int $institutionId): array
    {
        $reminders = TaskReminder::query()
            ->where('is_sent', false)
            ->where('reminder_time', '<=', now())
            ->whereHas('task', function ($q) use ($institutionId) {
                $q->where('institution_id', $institutionId);
            })
            ->with(['task.assignments.user'])
            ->orderBy('reminder_time')
            ->limit(50)
            ->get();

        $sent = 0;

        foreach ($reminders as $reminder) {
            foreach ($reminder->task->assignments as $assignment) {
                if (in_array($assignment->status, ['Declined', 'Completed'], true)) {
                    continue;
                }

                $assignee = $assignment->user;
                $phone = $this->validPhoneForUser($assignee);
                if (! $phone) {
                    continue;
                }

                $message = $this->formatter->format(
                    'TASK REMINDER',
                    $this->formatter->greeting(optional($assignee)->name),
                    [
                        $this->formatter->field('Task', (string) $reminder->task->title),
                        $this->formatter->field(
                            'Deadline',
                            $reminder->task->deadline ? $reminder->task->deadline->format('Y-m-d') : 'not set'
                        ),
                        'Please update your progress.',
                    ],
                    optional(Institution::find($reminder->task->institution_id))->name
                );

                $result = $this->sendMessage($phone, $message);
                if ($result['success']) {
                    $sent++;
                }
            }

            $reminder->is_sent = true;
            $reminder->save();
        }

        return ['success' => true, 'data' => ['processed' => $reminders->count(), 'sent' => $sent]];
    }

    public function notifyProgress(TaskAssignment $assignment, string $status, int $progress, $comment = null): array
    {
        $assignment->load(['task.creator', 'user']);
        $creator = $assignment->task->creator;
        $phone = $this->validPhoneForUser($creator);
        if (! $phone) {
            return ['success' => false, 'error' => 'Task creator has no valid phone'];
        }

        $who = $assignment->user ? $assignment->user->name : 'Assignee';
        $lines = [
            $this->formatter->field('Task', (string) $assignment->task->title),
            $this->formatter->field('Assignee', $who),
            $this->formatter->field('Progress', $progress.'% ('.$status.')'),
        ];
        if ($comment) {
            $lines[] = $this->formatter->field('Comment', (string) $comment);
        }

        $message = $this->formatter->format(
            'TASK PROGRESS UPDATE',
            null,
            $lines,
            optional(Institution::find($assignment->task->institution_id))->name
        );

        return $this->sendMessage($phone, $message);
    }

    protected function loadAssignmentContext(int $institutionId, int $assignmentId)
    {
        return TaskAssignment::query()
            ->where('id', $assignmentId)
            ->whereHas('task', function ($q) use ($institutionId) {
                $q->where('institution_id', $institutionId);
            })
            ->with(['task.attachments', 'task.creator', 'user'])
            ->first();
    }

    protected function sendAssignmentMessage(TaskAssignment $assignment, $messageTemplate = null): array
    {
        $assignment->loadMissing(['task.attachments', 'task.creator', 'user']);
        $task = $assignment->task;
        $assignee = $assignment->user;

        $phone = $this->validPhoneForUser($assignee);
        if (! $phone) {
            return ['success' => false, 'error' => 'Assignee has no valid phone'];
        }

        $template = $messageTemplate ?: ($task->notification_template ?: 'New task: {subject} - deadline {deadline}. Link: {login_link}');
        $loginLink = rtrim((string) config('app.frontend_url', config('app.url')), '/').'/task-invite/'.$assignment->invite_token;

        $raw = str_replace(
            ['{name}', '{subject}', '{priority}', '{description}', '{deadline}', '{login_link}'],
            [
                $assignee->name,
                $task->title,
                $task->priority,
                (string) $task->description,
                $task->deadline ? $task->deadline->format('Y-m-d') : '',
                $loginLink,
            ],
            $template
        );

        $institutionName = optional(Institution::find($task->institution_id))->name;
        $message = $this->formatter->wrap($raw, 'NEW TASK', $institutionName);

        $result = $this->sendMessage($phone, $message);
        if (! $result['success']) {
            return $result;
        }

        foreach ($task->attachments as $attachment) {
            $this->sendMessage(
                $phone,
                $this->formatter->wrap('Attachment: '.$attachment->public_url, 'TASK ATTACHMENT', $institutionName)
            );
        }

        $this->notifyCc(
            $task->id,
            $this->formatter->format(
                'TASK ASSIGNED',
                null,
                [
                    $this->formatter->field('Task', (string) $task->title),
                    $this->formatter->field('Assignee', (string) $assignee->name),
                ],
                $institutionName
            )
        );

        return ['success' => true, 'data' => ['assignment_id' => $assignment->id]];
    }

    protected function notifyCc(int $taskId, string $message): void
    {
        $ccRows = TaskCc::query()->where('task_id', $taskId)->with('user:id,name,phone_number')->get();
        foreach ($ccRows as $cc) {
            $phone = $this->validPhoneForUser($cc->user);
            if (! $phone) {
                continue;
            }
            $this->sendMessage($phone, $message);
        }
    }

    protected function validPhoneForUser($user)
    {
        if (! $user) {
            return null;
        }

        $raw = $user->phone_number ?: (property_exists($user, 'phone') ? $user->phone : null);
        if (! $raw) {
            return null;
        }

        return $this->whatsApp->normalizePhoneNumber((string) $raw);
    }

    protected function sendMessage(string $phone, string $text): array
    {
        if (! $this->whatsApp->isConfigured()) {
            return ['success' => false, 'error' => 'WhatsApp provider is not configured'];
        }

        $result = $this->whatsApp->sendTemplateMessage($phone, [
            'message' => $text,
            '2' => $text,
        ]);

        return [
            'success' => (bool) ($result['success'] ?? false),
            'error' => $result['error'] ?? null,
            'provider_response' => $result,
        ];
    }
}
