<?php

namespace App\Modules\Tasks\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Tasks\Services\TaskNotificationService;
use Illuminate\Http\Request;

class TaskInviteController extends Controller
{
    protected $notificationService;

    public function __construct(TaskNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function show($token)
    {
        $invite = $this->notificationService->getInvite((string) $token);
        if (! $invite) {
            return response()->json(['success' => false, 'data' => null, 'message' => 'Invalid or expired invite token'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'assignment_id' => $invite->id,
                'status' => $invite->status,
                'task' => $invite->task,
                'assignee' => $invite->user,
            ],
        ]);
    }

    public function respond(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'action' => 'required|string|in:accept,decline',
        ]);

        $user = auth()->user();
        if (! $user || ! $user->institution_id) {
            return response()->json(['success' => false, 'data' => null, 'message' => 'Authentication required'], 401);
        }

        $result = $this->notificationService->respondInvite(
            (int) $user->institution_id,
            (int) $user->id,
            (string) $data['token'],
            (string) $data['action']
        );

        $status = $result['success'] ? 200 : 422;

        return response()->json([
            'success' => (bool) $result['success'],
            'data' => $result['data'] ?? null,
            'message' => $result['error'] ?? null,
        ], $status);
    }
}
