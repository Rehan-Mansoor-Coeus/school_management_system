<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Canteen\Controllers\AttendanceController;
use App\Modules\Canteen\Controllers\DashboardController;
use App\Modules\Canteen\Controllers\FeedingPlanController;
use App\Modules\Canteen\Controllers\MealPlanController;
use App\Modules\Canteen\Controllers\PosController;
use App\Modules\Canteen\Controllers\ReportController;
use App\Modules\Canteen\Controllers\SalesController;
use App\Modules\Canteen\Controllers\StudentLookupController;
use App\Modules\Canteen\Controllers\SubscriptionController;
use App\Modules\Canteen\Controllers\VerificationController;
use App\Modules\Canteen\Controllers\WalletController;

Route::prefix('canteen')->group(function () {
    Route::middleware(['auth:api', 'module_enabled:canteen'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->middleware('permission:canteen.view|canteen.manage');

        Route::get('meals', [MealPlanController::class, 'index'])->middleware('permission:canteen.view|canteen.manage');
        Route::post('meals', [MealPlanController::class, 'store'])->middleware('permission:canteen.manage');
        Route::put('meals/{id}', [MealPlanController::class, 'update'])->middleware('permission:canteen.manage');
        Route::delete('meals/{id}', [MealPlanController::class, 'destroy'])->middleware('permission:canteen.manage');

        Route::get('feeding-plans/reference', [FeedingPlanController::class, 'referenceData'])->middleware('permission:canteen.view|canteen.manage');
        Route::get('feeding-plans', [FeedingPlanController::class, 'index'])->middleware('permission:canteen.view|canteen.manage');
        Route::post('feeding-plans', [FeedingPlanController::class, 'store'])->middleware('permission:canteen.manage');
        Route::put('feeding-plans/{id}', [FeedingPlanController::class, 'update'])->middleware('permission:canteen.manage');
        Route::delete('feeding-plans/{id}', [FeedingPlanController::class, 'destroy'])->middleware('permission:canteen.manage');

        Route::get('wallets', [WalletController::class, 'index'])->middleware('permission:canteen.manage');
        Route::get('wallets/my', [WalletController::class, 'myWallet'])->middleware('permission:canteen.view|canteen.manage');
        Route::post('wallets/student/{studentId}', [WalletController::class, 'ensureForStudent'])->middleware('permission:canteen.manage');
        Route::post('wallets/{walletId}/top-up', [WalletController::class, 'topUp'])->middleware('permission:canteen.manage');

        Route::get('students', [StudentLookupController::class, 'index'])->middleware('permission:canteen.manage');

        Route::get('subscriptions', [SubscriptionController::class, 'index'])->middleware('permission:canteen.manage');
        Route::post('subscriptions', [SubscriptionController::class, 'store'])->middleware('permission:canteen.manage');
        Route::get('subscriptions/my', [SubscriptionController::class, 'mySubscriptions'])->middleware('permission:canteen.view|canteen.manage');

        Route::post('verify/lookup', [VerificationController::class, 'lookup'])->middleware('permission:canteen.verify|canteen.manage');
        Route::post('verify/serve', [VerificationController::class, 'serve'])->middleware('permission:canteen.verify|canteen.manage');

        Route::get('pos/menu', [PosController::class, 'menu'])->middleware('permission:canteen.verify|canteen.manage');
        Route::get('pos/payment-methods', [SalesController::class, 'paymentMethods'])->middleware('permission:canteen.verify|canteen.manage');
        Route::post('pos/checkout', [PosController::class, 'checkout'])->middleware('permission:canteen.verify|canteen.manage');
        Route::post('pos/orders/{orderId}/confirm', [PosController::class, 'confirmPayment'])->middleware('permission:canteen.verify|canteen.manage');

        Route::get('sales', [SalesController::class, 'index'])->middleware('permission:canteen.view|canteen.manage|canteen.reports');
        Route::get('sales/{orderId}', [SalesController::class, 'show'])->middleware('permission:canteen.view|canteen.manage|canteen.reports');
        Route::get('sales/{orderId}/invoice', [SalesController::class, 'invoice'])->middleware('permission:canteen.view|canteen.manage|canteen.reports');
        Route::get('sales/{orderId}/receipt', [SalesController::class, 'receipt'])->middleware('permission:canteen.verify|canteen.view|canteen.manage|canteen.reports');

        Route::get('attendance', [AttendanceController::class, 'index'])->middleware('permission:canteen.view|canteen.manage|canteen.reports');
        Route::post('attendance/{id}/void', [AttendanceController::class, 'void'])->middleware('permission:canteen.manage');

        Route::get('reports/summary', [ReportController::class, 'summary'])->middleware('permission:canteen.reports|canteen.manage');
    });
});
