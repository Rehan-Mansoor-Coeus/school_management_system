<?php

namespace App\Modules\Tasks\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Tasks\Concerns\ResolvesInstitution;
use App\Modules\Tasks\Services\TaskNotificationService;
use Illuminate\Http\Request;

class TaskWorkflowController extends Controller
{
    use ResolvesInstitution;

    protected $notificationService;

    public function __construct(TaskNotificationService $notificationService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:tasks');
        $this->notificationService = $notificationService;
    }

    public function notifyAssignment(Request $request)
    {
        $data = $request->validate([
            'assignment_id' => 'required|integer|exists:task_assignments,id',
            'message_template' => 'nullable|string',
        ]);

        $result = $this->notificationService->notifyAssignment(
            $this->institutionId(),
            (int) $data['assignment_id'],
            $data['message_template'] ?? null
        );

        return response()->json(['success' => (bool) $result['success'], 'data' => $result]);
    }

    public function syncOverdue()
    {
        $result = $this->notificationService->syncOverdue($this->institutionId());

        return response()->json(['success' => true, 'data' => $result['data']]);
    }

    public function processScheduled()
    {
        $result = $this->notificationService->processScheduled($this->institutionId());

        return response()->json(['success' => true, 'data' => $result['data']]);
    }

    public function processReminders()
    {
        $result = $this->notificationService->processReminders($this->institutionId());

        return response()->json(['success' => true, 'data' => $result['data']]);
    }
}
