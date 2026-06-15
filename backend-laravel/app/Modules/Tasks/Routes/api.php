<?php

use App\Modules\Tasks\Controllers\TaskController;
use App\Modules\Tasks\Controllers\TaskInviteController;
use App\Modules\Tasks\Controllers\TaskSettingsController;
use App\Modules\Tasks\Controllers\TaskWorkflowController;
use Illuminate\Support\Facades\Route;

Route::prefix('tasks')->group(function () {
    Route::get('invite/{token}', [TaskInviteController::class, 'show']);

    Route::middleware(['auth:api', 'module_enabled:tasks'])->group(function () {
        Route::post('invite/respond', [TaskInviteController::class, 'respond']);

        Route::middleware('permission:tasks.view|tasks.assign|tasks.manage')->get('my/list', [TaskController::class, 'myTasks']);
        Route::middleware('permission:tasks.view|tasks.assign|tasks.manage')->get('pending/acceptances', [TaskController::class, 'pendingAcceptances']);
        Route::middleware('permission:tasks.assign|tasks.manage')->post('assignments/{assignmentId}/progress', [TaskController::class, 'updateProgress']);

        Route::middleware('permission:tasks.view|tasks.manage')->get('settings/categories', [TaskSettingsController::class, 'categories']);
        Route::middleware('permission:tasks.manage')->post('settings/categories', [TaskSettingsController::class, 'storeCategory']);
        Route::middleware('permission:tasks.manage')->put('settings/categories/{id}', [TaskSettingsController::class, 'updateCategory']);
        Route::middleware('permission:tasks.manage')->delete('settings/categories/{id}', [TaskSettingsController::class, 'destroyCategory']);

        Route::middleware('permission:tasks.view|tasks.manage')->get('settings/templates', [TaskSettingsController::class, 'templates']);
        Route::middleware('permission:tasks.manage')->post('settings/templates', [TaskSettingsController::class, 'storeTemplate']);
        Route::middleware('permission:tasks.manage')->put('settings/templates/{id}', [TaskSettingsController::class, 'updateTemplate']);
        Route::middleware('permission:tasks.manage')->delete('settings/templates/{id}', [TaskSettingsController::class, 'destroyTemplate']);

        Route::middleware('permission:tasks.manage|tasks.assign')->post('workflow/notify-assignment', [TaskWorkflowController::class, 'notifyAssignment']);
        Route::middleware('permission:tasks.manage')->post('workflow/sync-overdue', [TaskWorkflowController::class, 'syncOverdue']);
        Route::middleware('permission:tasks.manage')->post('workflow/process-scheduled', [TaskWorkflowController::class, 'processScheduled']);
        Route::middleware('permission:tasks.manage')->post('workflow/process-reminders', [TaskWorkflowController::class, 'processReminders']);

        Route::middleware('permission:tasks.view|tasks.manage')->get('/', [TaskController::class, 'index']);
        Route::middleware('permission:tasks.create|tasks.manage')->post('/', [TaskController::class, 'store']);
        Route::middleware('permission:tasks.view|tasks.manage')->get('{id}', [TaskController::class, 'show']);
        Route::middleware('permission:tasks.manage')->put('{id}', [TaskController::class, 'update']);
        Route::middleware('permission:tasks.manage')->delete('{id}', [TaskController::class, 'destroy']);
    });
});
