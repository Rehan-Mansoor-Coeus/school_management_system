<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Hr\Controllers\AdvanceController;
use App\Modules\Hr\Controllers\CatalogController;
use App\Modules\Hr\Controllers\DashboardController;
use App\Modules\Hr\Controllers\FinanceController;
use App\Modules\Hr\Controllers\JobController;
use App\Modules\Hr\Controllers\LetterController;
use App\Modules\Hr\Controllers\PayrollController;
use App\Modules\Hr\Controllers\PayslipController;
use App\Modules\Hr\Controllers\ReportController;
use App\Modules\Hr\Controllers\StaffController;
use App\Modules\Hr\Controllers\TimesheetController;

Route::prefix('hr')->group(function () {
    Route::get('payslips/verify/{code}', [PayslipController::class, 'verify']);

    Route::middleware(['auth:api', 'module_enabled:hr', 'permission:hr.view|hr.manage'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::get('staff', [StaffController::class, 'index']);
        Route::get('staff/next-code', [StaffController::class, 'nextCode']);
        Route::get('staff/{id}', [StaffController::class, 'show']);
        Route::post('staff', [StaffController::class, 'store']);
        Route::put('staff/{id}', [StaffController::class, 'update']);
        Route::get('users/search', [StaffController::class, 'usersSearch']);

        Route::get('categories', [CatalogController::class, 'categories']);
        Route::post('categories', [CatalogController::class, 'storeCategory']);
        Route::put('categories/{id}', [CatalogController::class, 'updateCategory']);
        Route::delete('categories/{id}', [CatalogController::class, 'deleteCategory']);

        Route::get('position-rates', [CatalogController::class, 'positionRates']);
        Route::post('position-rates', [CatalogController::class, 'storePositionRate']);
        Route::put('position-rates/{id}', [CatalogController::class, 'updatePositionRate']);
        Route::delete('position-rates/{id}', [CatalogController::class, 'deletePositionRate']);

        Route::get('allowance-types', [CatalogController::class, 'allowanceTypes']);
        Route::post('allowance-types', [CatalogController::class, 'storeAllowanceType']);
        Route::put('allowance-types/{id}', [CatalogController::class, 'updateAllowanceType']);
        Route::delete('allowance-types/{id}', [CatalogController::class, 'deleteAllowanceType']);

        Route::get('deduction-types', [CatalogController::class, 'deductionTypes']);
        Route::post('deduction-types', [CatalogController::class, 'storeDeductionType']);
        Route::put('deduction-types/{id}', [CatalogController::class, 'updateDeductionType']);
        Route::delete('deduction-types/{id}', [CatalogController::class, 'deleteDeductionType']);

        Route::get('jobs', [JobController::class, 'index']);
        Route::get('jobs/{id}', [JobController::class, 'show']);
        Route::post('jobs', [JobController::class, 'store']);
        Route::put('jobs/{id}', [JobController::class, 'update']);
        Route::post('jobs/{id}/staff', [JobController::class, 'assignStaff']);
        Route::put('jobs/{jobId}/staff/{rowId}', [JobController::class, 'updateStaff']);
        Route::delete('jobs/{jobId}/staff/{rowId}', [JobController::class, 'removeStaff']);
        Route::post('jobs/{id}/sync-timesheet', [JobController::class, 'syncTimesheet']);

        Route::get('payroll-runs', [PayrollController::class, 'index']);
        Route::get('payroll-runs/{id}', [PayrollController::class, 'show']);
        Route::post('payroll-runs/from-job/{jobId}', [PayrollController::class, 'createFromJob']);
        Route::post('payroll-runs/monthly', [PayrollController::class, 'createMonthly']);
        Route::put('payroll-runs/{runId}/items/{itemId}', [PayrollController::class, 'updateItem']);
        Route::post('payroll-runs/{id}/submit-review', [PayrollController::class, 'submitReview']);
        Route::post('payroll-runs/{id}/approve', [PayrollController::class, 'approve']);
        Route::post('payroll-runs/{id}/forward-finance', [PayrollController::class, 'forwardFinance']);
        Route::post('payroll-runs/{id}/reject', [PayrollController::class, 'reject']);

        Route::get('payslips', [PayslipController::class, 'index']);
        Route::post('payslips/generate/{itemId}', [PayslipController::class, 'generate']);
        Route::get('payslips/detail/{itemId}', [PayslipController::class, 'detail']);

        Route::get('finance', [FinanceController::class, 'index']);
        Route::put('finance/{id}', [FinanceController::class, 'update']);

        Route::get('advances', [AdvanceController::class, 'index']);
        Route::post('advances', [AdvanceController::class, 'store']);

        Route::get('reports/summary', [ReportController::class, 'summary']);
        Route::get('reports/staff-history/{staffId}', [ReportController::class, 'staffHistory']);

        Route::get('timesheet', [TimesheetController::class, 'index']);
        Route::post('timesheet', [TimesheetController::class, 'store']);

        Route::get('letters/templates', [LetterController::class, 'templates']);
        Route::post('letters/templates', [LetterController::class, 'storeTemplate']);
        Route::put('letters/templates/{id}', [LetterController::class, 'updateTemplate']);
        Route::delete('letters/templates/{id}', [LetterController::class, 'deleteTemplate']);
        Route::post('letters/preview', [LetterController::class, 'preview']);
        Route::post('letters/send', [LetterController::class, 'send']);
        Route::get('letters/history', [LetterController::class, 'history']);
    });
});
