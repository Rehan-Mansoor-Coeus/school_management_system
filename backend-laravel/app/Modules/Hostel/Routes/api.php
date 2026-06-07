<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Hostel\Controllers\AllocationController;
use App\Modules\Hostel\Controllers\ClearanceController;
use App\Modules\Hostel\Controllers\DashboardController;
use App\Modules\Hostel\Controllers\HostelController;
use App\Modules\Hostel\Controllers\MaintenanceController;
use App\Modules\Hostel\Controllers\PaymentController;
use App\Modules\Hostel\Controllers\ReferenceController;
use App\Modules\Hostel\Controllers\RegistrationController;
use App\Modules\Hostel\Controllers\RoomController;

Route::prefix('hostel')->group(function () {
    Route::middleware(['auth:api', 'module_enabled:hostel'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->middleware('permission:hostel.view|hostel.manage');

        Route::get('reference', [ReferenceController::class, 'index'])->middleware('permission:hostel.view|hostel.manage|hostel.allocate|hostel.payments|hostel.maintenance|hostel.clearance');
        Route::get('students', [ReferenceController::class, 'students'])->middleware('permission:hostel.manage|hostel.allocate|hostel.payments');

        Route::get('hostels', [HostelController::class, 'index'])->middleware('permission:hostel.view|hostel.manage');
        Route::post('hostels', [HostelController::class, 'store'])->middleware('permission:hostel.manage');
        Route::put('hostels/{id}', [HostelController::class, 'update'])->middleware('permission:hostel.manage');
        Route::delete('hostels/{id}', [HostelController::class, 'destroy'])->middleware('permission:hostel.manage');

        Route::get('rooms', [RoomController::class, 'index'])->middleware('permission:hostel.view|hostel.manage|hostel.allocate');
        Route::post('rooms', [RoomController::class, 'store'])->middleware('permission:hostel.manage');
        Route::put('rooms/{id}', [RoomController::class, 'update'])->middleware('permission:hostel.manage');
        Route::delete('rooms/{id}', [RoomController::class, 'destroy'])->middleware('permission:hostel.manage');

        Route::get('registrations', [RegistrationController::class, 'index'])->middleware('permission:hostel.view|hostel.manage|hostel.allocate');
        Route::get('registrations/my', [RegistrationController::class, 'myRegistration'])->middleware('permission:hostel.view');
        Route::post('registrations', [RegistrationController::class, 'store'])->middleware('permission:hostel.view');
        Route::post('registrations/{id}/review', [RegistrationController::class, 'review'])->middleware('permission:hostel.manage|hostel.allocate');

        Route::get('allocations', [AllocationController::class, 'index'])->middleware('permission:hostel.view|hostel.manage|hostel.allocate');
        Route::get('allocations/my', [AllocationController::class, 'myAllocation'])->middleware('permission:hostel.view');
        Route::post('allocations', [AllocationController::class, 'store'])->middleware('permission:hostel.manage|hostel.allocate');
        Route::post('allocations/{id}/check-in', [AllocationController::class, 'checkIn'])->middleware('permission:hostel.manage|hostel.allocate');
        Route::post('allocations/{id}/release', [AllocationController::class, 'release'])->middleware('permission:hostel.manage|hostel.allocate|hostel.clearance');

        Route::get('payments', [PaymentController::class, 'index'])->middleware('permission:hostel.view|hostel.manage|hostel.payments');
        Route::get('payments/my', [PaymentController::class, 'myPayments'])->middleware('permission:hostel.view');
        Route::post('payments', [PaymentController::class, 'store'])->middleware('permission:hostel.manage|hostel.payments');
        Route::post('payments/{id}/record', [PaymentController::class, 'recordPayment'])->middleware('permission:hostel.manage|hostel.payments');
        Route::post('payments/{id}/waive', [PaymentController::class, 'waive'])->middleware('permission:hostel.manage|hostel.payments');

        Route::get('clearances', [ClearanceController::class, 'index'])->middleware('permission:hostel.view|hostel.manage|hostel.clearance');
        Route::put('clearances/{id}', [ClearanceController::class, 'update'])->middleware('permission:hostel.manage|hostel.clearance');

        Route::get('maintenance', [MaintenanceController::class, 'index'])->middleware('permission:hostel.view|hostel.manage|hostel.maintenance');
        Route::post('maintenance', [MaintenanceController::class, 'store'])->middleware('permission:hostel.view|hostel.maintenance');
        Route::put('maintenance/{id}', [MaintenanceController::class, 'update'])->middleware('permission:hostel.manage|hostel.maintenance');
    });
});
