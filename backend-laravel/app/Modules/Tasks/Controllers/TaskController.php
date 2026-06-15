<?php

namespace App\Modules\Tasks\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Tasks\Concerns\ResolvesInstitution;
use App\Modules\Tasks\Models\Task;
use App\Modules\Tasks\Services\TaskNotificationService;
use App\Modules\Tasks\Services\TaskService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    use ResolvesInstitution;

    protected $taskService;
    protected $notificationService;

    public function __construct(TaskService $taskService, TaskNotificationService $notificationService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:tasks');
        $this->taskService = $taskService;
        $this->notificationService = $notificationService;
    }

    public function index(Request $request)
    {
        $tasks = $this->taskService->listTasks($this->institutionId(), $request->all());

        return response()->json(['success' => true, 'data' => $tasks]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'start_time' => 'nullable|string|max:10',
            'deadline' => 'nullable|date',
            'deadline_time' => 'nullable|string|max:10',
            'category_id' => 'nullable|integer|exists:task_categories,id',
            'notification_template' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'schedule_later' => 'nullable|boolean',
            'schedules' => 'nullable|array',
            'schedules.*' => 'nullable|date',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'integer|exists:users,id',
            'cc_user_ids' => 'nullable|array',
            'cc_user_ids.*' => 'integer|exists:users,id',
            'reminder_times' => 'nullable|array',
            'reminder_times.*' => 'nullable|date',
            'source_files' => 'nullable|array',
            'source_files.*' => 'file|max:20480',
        ]);

        if ($request->hasFile('source_files')) {
            $data['source_files'] = $request->file('source_files');
        }

        $task = $this->taskService->createTask($this->institutionId(), (int) auth()->id(), $data);

        if (! $task->is_scheduled && $task->assignments->count() > 0) {
            foreach ($task->assignments as $assignment) {
                $this->notificationService->notifyAssignment($this->institutionId(), (int) $assignment->id, $task->notification_template);
            }
        }

        return response()->json(['success' => true, 'data' => $task], 201);
    }

    public function show($id)
    {
        $task = $this->taskService->getTaskDetails($this->institutionId(), (int) $id);

        return response()->json(['success' => true, 'data' => $task]);
    }

    public function update(Request $request, $id)
    {
        $task = Task::where('institution_id', $this->institutionId())->findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'start_time' => 'nullable|string|max:10',
            'deadline' => 'nullable|date',
            'deadline_time' => 'nullable|string|max:10',
            'category_id' => 'nullable|integer|exists:task_categories,id',
            'notification_template' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'schedule_later' => 'nullable|boolean',
            'schedules' => 'nullable|array',
            'schedules.*' => 'nullable|date',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => 'integer|exists:users,id',
            'cc_user_ids' => 'nullable|array',
            'cc_user_ids.*' => 'integer|exists:users,id',
            'reminder_times' => 'nullable|array',
            'reminder_times.*' => 'nullable|date',
        ]);

        $updated = $this->taskService->updateTask($task, $data);

        return response()->json(['success' => true, 'data' => $updated]);
    }

    public function destroy($id)
    {
        $task = Task::where('institution_id', $this->institutionId())->findOrFail($id);
        $this->taskService->deleteTask($task);

        return response()->json(['success' => true, 'data' => ['deleted' => true]]);
    }

    public function myTasks(Request $request)
    {
        $rows = $this->taskService->myTasks($this->institutionId(), (int) auth()->id(), $request->all());

        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function pendingAcceptances()
    {
        $rows = $this->taskService->pendingAcceptances($this->institutionId());

        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function updateProgress(Request $request, $assignmentId)
    {
        $data = $request->validate([
            'progress' => 'required|integer|min:0|max:100',
            'status' => 'nullable|string|max:50',
            'comment' => 'nullable|string',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:20480',
        ]);

        if ($request->hasFile('attachments')) {
            $data['attachments'] = $request->file('attachments');
        }

        $assignment = $this->taskService->updateAssignmentProgress(
            $this->institutionId(),
            (int) $assignmentId,
            (int) auth()->id(),
            $data
        );

        $this->notificationService->notifyProgress(
            $assignment,
            $assignment->status,
            (int) $assignment->progress,
            $data['comment'] ?? null
        );

        return response()->json(['success' => true, 'data' => $assignment]);
    }
}
