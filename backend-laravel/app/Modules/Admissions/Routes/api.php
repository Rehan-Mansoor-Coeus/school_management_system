<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Admissions\Controllers\ApplicationController;
use App\Modules\Admissions\Controllers\RegistryController;
use App\Modules\Admissions\Controllers\DepartmentReviewController;
use App\Modules\Admissions\Controllers\RegistrarController;
use App\Modules\Admissions\Controllers\FinanceController;
use App\Modules\Admissions\Controllers\PaymentController;
use App\Modules\Admissions\Controllers\PaymentProofController;
use App\Modules\Admissions\Controllers\StripePaymentController;
use App\Modules\Admissions\Controllers\CampayPaymentController;
use App\Modules\Admissions\Controllers\StudentDashboardController;
use App\Modules\Admissions\Controllers\CourseRegistrationController;
use App\Modules\Admissions\Controllers\NotificationController;

Route::prefix('admissions')->group(function () {
    Route::post('payment/webhook', [PaymentController::class, 'webhook']);
    Route::post('payment/stripe/webhook', [StripePaymentController::class, 'webhook']);

    Route::middleware(['auth:api', 'module_enabled:admissions'])->group(function () {
        Route::get('student/dashboard', [StudentDashboardController::class, 'index']);
        Route::get('reference-data', [ApplicationController::class, 'referenceData']);
        Route::get('my-applicant', [ApplicationController::class, 'myApplicant']);
        Route::post('applicant', [ApplicationController::class, 'createApplicant']);
        Route::post('apply', [ApplicationController::class, 'submitApplication']);
        Route::get('my-applications', [ApplicationController::class, 'getMyApplications']);
        Route::middleware('role:registry|registrar|finance-officer|hod|head-of-department|institution-admin|admin|super-admin')->group(function () {
            Route::get('applications', [ApplicationController::class, 'index']);
        });
        Route::get('applications/{applicationId}', [ApplicationController::class, 'show']);
        Route::post('applications/{applicationId}/accept', [ApplicationController::class, 'acceptAdmission']);

        Route::post('payment/application-fee', [PaymentController::class, 'initiateApplicationFee']);
        Route::post('payment/application-fee/proof', [PaymentProofController::class, 'submitApplicationFeeProof']);
        Route::post('payment/tuition/proof', [PaymentProofController::class, 'submitTuitionProof']);
        Route::post('payment/tuition', [PaymentController::class, 'initiateTuition']);
        Route::post('payment/confirm-offline', [PaymentController::class, 'confirmOffline']);
        Route::get('payment/methods', [PaymentController::class, 'methods']);
        Route::get('payment/verify', [PaymentController::class, 'verify']);
        Route::post('payment/stripe/intent', [StripePaymentController::class, 'createIntent']);
        Route::post('payment/stripe/confirm', [StripePaymentController::class, 'confirm']);
        Route::post('payment/campay/collect', [CampayPaymentController::class, 'collect']);
        Route::get('payment/campay/status/{reference}', [CampayPaymentController::class, 'status']);

        Route::middleware('role:registry|finance-officer|institution-admin|admin|super-admin')->group(function () {
            Route::get('payment/pending-proofs', [PaymentProofController::class, 'pendingProofs']);
            Route::post('payment/proofs/{paymentId}/approve', [PaymentProofController::class, 'approve']);
            Route::post('payment/proofs/{paymentId}/reject', [PaymentProofController::class, 'reject']);
        });

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/{notificationId}/read', [NotificationController::class, 'markRead']);

        Route::get('courses/available', [CourseRegistrationController::class, 'availableCourses']);
        Route::post('courses/register', [CourseRegistrationController::class, 'register']);
        Route::get('courses/my-registrations', [CourseRegistrationController::class, 'myRegistrations']);

        Route::middleware('role:registry|institution-admin|admin|super-admin')->group(function () {
            Route::get('registry/pending', [RegistryController::class, 'pending']);
            Route::post('registry/review/{applicationId}', [RegistryController::class, 'review']);
            Route::get('registry/dashboard', [RegistryController::class, 'dashboard']);
        });

        Route::middleware('role:hod|head-of-department|institution-admin|admin|super-admin')->group(function () {
            Route::get('department/pending', [DepartmentReviewController::class, 'pending']);
            Route::post('department/decide/{applicationId}', [DepartmentReviewController::class, 'decide']);
            Route::get('department/dashboard', [DepartmentReviewController::class, 'dashboard']);
            Route::get('courses/pending-approval', [CourseRegistrationController::class, 'pendingHodApproval']);
            Route::post('courses/bulk-approve', [CourseRegistrationController::class, 'bulkApproveCourseRegistrations']);
            Route::post('courses/{registrationId}/approve', [CourseRegistrationController::class, 'approveCourseRegistration']);
            Route::post('courses/{registrationId}/reject', [CourseRegistrationController::class, 'rejectCourseRegistration']);
        });

        Route::middleware('role:registrar|institution-admin|admin|super-admin')->group(function () {
            Route::get('registrar/ready', [RegistrarController::class, 'readyForAdmission']);
            Route::post('registrar/admit/{applicationId}', [RegistrarController::class, 'admit']);
            Route::post('registrar/resend-letter/{applicationId}', [RegistrarController::class, 'resendAdmissionLetter']);
            Route::get('registrar/dashboard', [RegistrarController::class, 'dashboard']);
        });

        Route::middleware('role:finance-officer|institution-admin|admin|super-admin')->group(function () {
            Route::get('finance/pending-tuition', [FinanceController::class, 'pendingTuition']);
            Route::post('finance/verify/{applicationId}', [FinanceController::class, 'verifyTuition']);
            Route::get('finance/dashboard', [FinanceController::class, 'dashboard']);
        });
    });
});
