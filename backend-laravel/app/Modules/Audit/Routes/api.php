<?php

use App\Modules\Audit\Controllers\AuditLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('audit')->middleware(['auth:api', 'module_enabled:audit', 'permission:audit.view|audit.manage'])->group(function () {
    Route::get('logs', [AuditLogController::class, 'index']);
});
