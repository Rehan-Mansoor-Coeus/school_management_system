<?php

use App\Modules\Attendance\Controllers\AttendanceController;
use Illuminate\Support\Facades\Route;

Route::prefix('attendance')->middleware(['auth:api', 'module_enabled:attendance'])->group(function () {
    Route::post('clock-in', [AttendanceController::class, 'clockIn'])->middleware('permission:attendance.view|attendance.manage');
    Route::post('clock-out', [AttendanceController::class, 'clockOut'])->middleware('permission:attendance.view|attendance.manage');
    Route::get('my-records', [AttendanceController::class, 'myRecords'])->middleware('permission:attendance.view|attendance.manage');
    Route::get('admin-report', [AttendanceController::class, 'adminReport'])->middleware('permission:attendance.manage|attendance.view');
    Route::get('monthly-summary', [AttendanceController::class, 'monthlySummary'])->middleware('permission:attendance.manage|attendance.view');
});
