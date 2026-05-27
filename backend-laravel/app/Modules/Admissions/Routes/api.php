<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Admissions\Controllers\ApplicationController;
use App\Modules\Admissions\Controllers\AdmissionBoardController;
use App\Modules\Admissions\Controllers\RegistrarController;
use App\Modules\Admissions\Controllers\PaymentController;
use App\Modules\Admissions\Controllers\CourseRegistrationController;

Route::prefix('api/v1/admissions')->middleware('api')->group(function () {

    // Public routes (no auth needed)
    Route::post('/payment/webhook', [PaymentController::class, 'webhook']);

    // Authenticated routes
    Route::middleware('auth:api')->group(function () {

        // Applicant routes
        Route::post('/applicant', [ApplicationController::class, 'createApplicant']);
        Route::post('/apply', [ApplicationController::class, 'submitApplication']);
        Route::get('/my-applications', [ApplicationController::class, 'getMyApplications']);
        Route::get('/applications/{applicationId}', [ApplicationController::class, 'show']);

        // Payment routes
        Route::post('/payment/initiate', [PaymentController::class, 'initiate']);
        Route::get('/payment/verify', [PaymentController::class, 'verify']);

        // Course registration
        Route::post('/courses/register', [CourseRegistrationController::class, 'register']);

        // Admission Board routes
        Route::middleware('role:admission_board|admin')->group(function () {
            Route::get('/board/pending', [AdmissionBoardController::class, 'pendingReview']);
            Route::post('/board/review/{applicationId}', [AdmissionBoardController::class, 'review']);
            Route::post('/board/decide/{applicationId}', [AdmissionBoardController::class, 'decide']);
            Route::get('/board/dashboard', [AdmissionBoardController::class, 'dashboard']);
        });

        // Registrar routes
        Route::middleware('role:registrar|admin')->group(function () {
            Route::get('/registrar/ready', [RegistrarController::class, 'readyForAdmission']);
            Route::post('/registrar/admit/{applicationId}', [RegistrarController::class, 'admit']);
            Route::get('/registrar/dashboard', [RegistrarController::class, 'dashboard']);
        });

        // HOD routes - Course registration approval
        Route::middleware('role:hod|admin')->group(function () {
            Route::post('/courses/{registrationId}/approve', [CourseRegistrationController::class, 'approveCourseRegistration']);
            Route::post('/courses/{registrationId}/reject', [CourseRegistrationController::class, 'rejectCourseRegistration']);
        });

    });

});
