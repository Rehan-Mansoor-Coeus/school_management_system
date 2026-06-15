<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::get('institutions', 'Api\AuthController@publicInstitutions');
    Route::post('register', 'Api\AuthController@register');
    Route::post('login', 'Api\AuthController@login');
    Route::post('signup/request-otp', 'Api\AuthController@requestSignupOtp');
    Route::post('signup/verify-otp', 'Api\AuthController@verifySignupOtp');
    Route::post('signup/complete', 'Api\AuthController@studentSignup');
    Route::post('forgot-username', 'Api\AuthController@requestForgotUsername');
    Route::post('forgot-password/request-otp', 'Api\AuthController@requestPasswordResetOtp');
    Route::post('forgot-password/verify-otp', 'Api\AuthController@verifyPasswordResetOtp');
    Route::post('forgot-password/reset', 'Api\AuthController@resetPassword');

    Route::middleware('auth:api')->group(function () {
        Route::post('logout', 'Api\AuthController@logout');
        Route::get('user', 'Api\AuthController@me');
        Route::post('change-password', 'Api\AuthController@changePassword');
    });
});

Route::prefix('public')->group(function () {
    Route::get('settings', 'Api\\Landing\\LandingController@settings');
    Route::get('institutions', 'Api\\Landing\\LandingController@institutions');
    Route::get('institutions/{id}', 'Api\\Landing\\LandingController@institution');
    Route::post('institution-requests', 'Api\\Landing\\LandingController@storeInstitutionRequest');
    Route::post('support-tickets', 'Api\\Landing\\LandingController@storeSupportTicket');
});

Route::middleware('auth:api')->get('me', 'Api\AuthController@me');

Route::middleware('auth:api')->group(function () {
    Route::get('general-settings', 'Api\\GeneralSettingsController@show');
    Route::put('general-settings', 'Api\\GeneralSettingsController@update');
    Route::get('institution-requests', 'Api\\InstitutionRegistrationRequestController@index');
    Route::post('institution-requests/{id}/approve', 'Api\\InstitutionRegistrationRequestController@approve');
    Route::post('institution-requests/{id}/reject', 'Api\\InstitutionRegistrationRequestController@reject');
    Route::get('app-notifications', 'Api\AppNotificationController@index');
    Route::post('app-notifications/{notificationId}/read', 'Api\AppNotificationController@markRead');
    Route::post('app-notifications/read-all', 'Api\AppNotificationController@markAllRead');
});

Route::get('letters/public/verify/{letter}', 'Api\Letters\LetterPublicController@verify');

Route::middleware('auth:api')->group(function () {
    Route::middleware(['module_enabled:users', 'permission:users.view|view_users|manage_users'])->get('users', 'Api\UserController@index');
    Route::middleware(['module_enabled:roles', 'permission:roles.view|view_roles|manage_roles|roles.manage'])->get('roles', 'Api\RoleController@index');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.view|view_permissions|manage_roles|permissions.manage'])->get('permissions', 'Api\PermissionController@index');

    Route::middleware(['module_enabled:users', 'permission:users.create|create_users|manage_users'])->post('users', 'Api\UserController@store');
    Route::middleware(['module_enabled:users', 'permission:users.edit|edit_users|manage_users'])->put('users/{user}', 'Api\UserController@update');
    Route::middleware(['module_enabled:users', 'permission:users.delete|delete_users|manage_users'])->delete('users/{user}', 'Api\UserController@destroy');
    Route::middleware(['module_enabled:users', 'permission:users.edit|edit_users|manage_users'])->post('users/{user}/roles', 'Api\UserController@assignRoles');
    Route::middleware(['module_enabled:users', 'permission:users.view'])->get('users', 'Api\UserController@index');
    Route::middleware(['module_enabled:roles', 'permission:roles.view'])->get('roles', 'Api\RoleController@index');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.view'])->get('permissions', 'Api\PermissionController@index');

    Route::middleware(['module_enabled:users', 'permission:users.create'])->post('users', 'Api\UserController@store');
    Route::middleware(['module_enabled:users', 'permission:users.edit'])->put('users/{user}', 'Api\UserController@update');
    Route::middleware(['module_enabled:users', 'permission:users.delete'])->delete('users/{user}', 'Api\UserController@destroy');
    Route::middleware(['module_enabled:users', 'permission:users.edit'])->post('users/{user}/roles', 'Api\UserController@assignRoles');

    Route::middleware(['module_enabled:roles', 'permission:roles.create|create_roles|manage_roles|roles.manage'])->post('roles', 'Api\RoleController@store');
    Route::middleware(['module_enabled:roles', 'permission:roles.edit|edit_roles|manage_roles|roles.manage'])->put('roles/{role}', 'Api\RoleController@update');
    Route::middleware(['module_enabled:roles', 'permission:roles.delete|delete_roles|manage_roles|roles.manage'])->delete('roles/{role}', 'Api\RoleController@destroy');
    Route::middleware(['module_enabled:roles', 'permission:roles.edit|assign_permissions|manage_roles|roles.manage'])->post('roles/{role}/permissions', 'Api\RoleController@assignPermissions');
    Route::middleware(['module_enabled:roles', 'permission:roles.create'])->post('roles', 'Api\RoleController@store');
    Route::middleware(['module_enabled:roles', 'permission:roles.edit'])->put('roles/{role}', 'Api\RoleController@update');
    Route::middleware(['module_enabled:roles', 'permission:roles.delete'])->delete('roles/{role}', 'Api\RoleController@destroy');
    Route::middleware(['module_enabled:roles', 'permission:roles.edit'])->post('roles/{role}/permissions', 'Api\RoleController@assignPermissions');

    Route::middleware(['module_enabled:permissions', 'permission:permissions.create|manage_roles|permissions.manage'])->post('permissions', 'Api\PermissionController@store');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.edit|manage_roles|permissions.manage'])->put('permissions/{permission}', 'Api\PermissionController@update');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.delete|manage_roles|permissions.manage'])->delete('permissions/{permission}', 'Api\PermissionController@destroy');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.create'])->post('permissions', 'Api\PermissionController@store');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.edit'])->put('permissions/{permission}', 'Api\PermissionController@update');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.delete'])->delete('permissions/{permission}', 'Api\PermissionController@destroy');

    Route::middleware(['module_enabled:institutions', 'permission:institutions.view'])->get('institutions', 'Api\InstitutionController@index');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.view'])->get('institutions/{id}', 'Api\InstitutionController@show');
    Route::get('my-institution', 'Api\InstitutionController@myInstitution');

    Route::prefix('timesheets')->group(function () {
        // Employee timesheet flow (simplified)
        Route::get('categories', 'Api\Timesheets\EmployeeTimesheetController@categories');
        Route::post('categories', 'Api\Timesheets\EmployeeTimesheetController@storeCategory')->middleware('permission:manage_timesheet_categories|timesheets.manage');
        Route::put('categories/{category}', 'Api\Timesheets\EmployeeTimesheetController@updateCategory')->middleware('permission:manage_timesheet_categories|timesheets.manage');
        Route::delete('categories/{category}', 'Api\Timesheets\EmployeeTimesheetController@destroyCategory')->middleware('permission:manage_timesheet_categories|timesheets.manage');

        Route::get('activities', 'Api\Timesheets\EmployeeTimesheetController@activities');
        Route::post('activities', 'Api\Timesheets\EmployeeTimesheetController@storeActivity')->middleware('permission:create_timesheet_activity|timesheets.create_entry|timesheets.manage');
        Route::put('activities/{activity}', 'Api\Timesheets\EmployeeTimesheetController@updateActivity')->middleware('permission:create_timesheet_activity|timesheets.create_entry|timesheets.manage');
        Route::delete('activities/{activity}', 'Api\Timesheets\EmployeeTimesheetController@destroyActivity')->middleware('permission:create_timesheet_activity|timesheets.create_entry|timesheets.manage');

        Route::get('working-week', 'Api\Timesheets\EmployeeTimesheetController@workingWeek');
        Route::post('working-week', 'Api\Timesheets\EmployeeTimesheetController@storeWorkingWeek')->middleware('permission:manage_own_working_week|timesheets.manage');

        Route::get('entries', 'Api\Timesheets\EmployeeTimesheetController@entries');
        Route::post('entries', 'Api\Timesheets\EmployeeTimesheetController@storeEntry')->middleware('permission:fill_timesheet|timesheets.create_entry|timesheets.manage');
        Route::put('entries/{entry}', 'Api\Timesheets\EmployeeTimesheetController@updateEntry')->middleware('permission:edit_own_timesheet|fill_timesheet|timesheets.manage');
        Route::delete('entries/{entry}', 'Api\Timesheets\EmployeeTimesheetController@destroyEntry')->middleware('permission:delete_own_timesheet|fill_timesheet|timesheets.manage');

        Route::get('admin/manage-all', 'Api\Timesheets\EmployeeTimesheetController@manageAll')->middleware('permission:view_all_timesheets|timesheets.manage|timesheets.review');
        Route::post('admin/entries/{entry}/approve', 'Api\Timesheets\EmployeeTimesheetController@approveEntry')->middleware('permission:approve_timesheets|timesheets.review');
        Route::post('admin/entries/{entry}/reject', 'Api\Timesheets\EmployeeTimesheetController@rejectEntry')->middleware('permission:reject_timesheets|timesheets.review');
        Route::get('admin/report', 'Api\Timesheets\EmployeeTimesheetController@report')->middleware('permission:view_timesheet_reports|timesheets.report|timesheets.view_timesheet_reports');
        Route::get('admin/overtime-report', 'Api\Timesheets\EmployeeTimesheetController@overtimeReport')->middleware('permission:view_overtime_reports|view_timesheet_reports|timesheets.report');

        // Legacy weekly flow (kept for backward compatibility)
        Route::get('mine', 'Api\TimesheetController@myTimesheets');
        Route::post('weekly', 'Api\TimesheetController@createOrGetWeekly');
        Route::post('{timesheet}/entries', 'Api\TimesheetController@addEntry');
        Route::post('{timesheet}/submit', 'Api\TimesheetController@submit');

        Route::get('approvals', 'Api\TimesheetController@approvals')->middleware('permission:timesheets.review');
        Route::post('{timesheet}/approve', 'Api\TimesheetController@approve')->middleware('permission:timesheets.review');
        Route::post('{timesheet}/reject', 'Api\TimesheetController@reject')->middleware('permission:timesheets.review');
        Route::post('{timesheet}/request-correction', 'Api\TimesheetController@requestCorrection')->middleware('permission:timesheets.review|request_timesheet_correction');

        Route::get('reports', 'Api\TimesheetController@reports')->middleware('permission:timesheets.report');
        Route::get('schedules', 'Api\TimesheetController@schedules')->middleware('permission:timesheets.manage');
        Route::post('schedules', 'Api\TimesheetController@upsertSchedule')->middleware('permission:timesheets.manage');

        Route::get('dashboard', 'Api\Timesheets\TimesheetExtendedController@dashboard');
        Route::get('shift-types', 'Api\Timesheets\TimesheetExtendedController@shiftTypes');
        Route::post('shift-types', 'Api\Timesheets\TimesheetExtendedController@storeShiftType')->middleware('permission:timesheets.manage_shift_types');
        Route::put('shift-types/{shiftType}', 'Api\Timesheets\TimesheetExtendedController@updateShiftType')->middleware('permission:timesheets.manage_shift_types');
        Route::get('references', 'Api\Timesheets\TimesheetExtendedController@references');
        Route::post('references', 'Api\Timesheets\TimesheetExtendedController@storeReference')->middleware('permission:timesheets.manage_course_hour_plans');

        Route::get('teacher-availabilities', 'Api\Timesheets\TimesheetExtendedController@teacherAvailabilities');
        Route::post('teacher-availabilities', 'Api\Timesheets\TimesheetExtendedController@storeTeacherAvailability')->middleware('permission:timesheets.manage_teacher_availability');
        Route::get('available-teachers', 'Api\Timesheets\TimesheetExtendedController@availableTeachers');

        Route::get('staff-work-schedules', 'Api\Timesheets\TimesheetExtendedController@staffWorkSchedules');
        Route::post('staff-work-schedules', 'Api\Timesheets\TimesheetExtendedController@storeStaffWorkSchedule')->middleware('permission:timesheets.manage_staff_schedules');

        Route::get('course-plans', 'Api\Timesheets\TimesheetExtendedController@coursePlans');
        Route::post('course-plans', 'Api\Timesheets\TimesheetExtendedController@storeCoursePlan')->middleware('permission:timesheets.manage_course_hour_plans');
        Route::post('course-plans/{plan}/suggest-timetable', 'Api\Timesheets\TimesheetExtendedController@generateTimetableSuggestion')->middleware('permission:timesheets.generate_timetable_suggestions');
        Route::post('timetable-suggestions/{suggestion}/accept', 'Api\Timesheets\TimesheetExtendedController@acceptTimetableSuggestion')->middleware('permission:timesheets.approve_timetable_suggestions');

        Route::get('teacher-schedules', 'Api\Timesheets\TimesheetExtendedController@teacherSchedules');
        Route::get('my-teaching-schedules', 'Api\Timesheets\TimesheetExtendedController@myTeachingSchedules');
        Route::post('teacher-schedules', 'Api\Timesheets\TimesheetExtendedController@storeTeacherSchedule')->middleware('permission:timesheets.assign_teacher_schedules');

        Route::get('teaching-entries', 'Api\Timesheets\TimesheetExtendedController@teachingEntries');
        Route::post('teaching-entries', 'Api\Timesheets\TimesheetExtendedController@storeTeachingEntry')->middleware('permission:timesheets.submit_teaching_timesheets');
        Route::get('staff-entries', 'Api\Timesheets\TimesheetExtendedController@staffEntries');
        Route::post('staff-entries', 'Api\Timesheets\TimesheetExtendedController@storeStaffEntry')->middleware('permission:timesheets.submit_staff_timesheets');

        Route::get('entry-approvals', 'Api\Timesheets\TimesheetExtendedController@entryApprovals')->middleware('permission:timesheets.approve_timesheets');
        Route::post('entry-approvals/review', 'Api\Timesheets\TimesheetExtendedController@reviewEntry')->middleware('permission:timesheets.approve_timesheets');

        Route::get('extended-reports', 'Api\Timesheets\TimesheetExtendedController@extendedReports')->middleware('permission:timesheets.view_timesheet_reports');
        Route::get('notifications', 'Api\Timesheets\TimesheetExtendedController@notifications')->middleware('permission:manage_timesheet_notifications|timesheets.manage');
        Route::post('notifications/{notification}/read', 'Api\Timesheets\TimesheetExtendedController@markNotificationRead')->middleware('permission:manage_timesheet_notifications|timesheets.manage');
    });
    Route::middleware(['module_enabled:institutions', 'permission:institutions.view'])->get('institutions', 'Api\InstitutionController@index');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.create'])->post('institutions', 'Api\InstitutionController@store');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.view'])->get('institutions/{id}', 'Api\InstitutionController@show');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->match(['put', 'post'], 'institutions/{id}', 'Api\InstitutionController@update');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.delete'])->delete('institutions/{id}', 'Api\InstitutionController@destroy');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.view'])->get('departments', 'Api\DepartmentController@index');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.create'])->post('departments', 'Api\DepartmentController@store');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->put('departments/{department}', 'Api\DepartmentController@update');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.delete'])->delete('departments/{department}', 'Api\DepartmentController@destroy');

    Route::middleware(['module_enabled:academics', 'permission:academics.semesters.view'])->get('academics/semesters', 'Api\AcademicController@semesters');
    Route::middleware(['module_enabled:academics', 'permission:academics.semesters.create'])->post('academics/semesters', 'Api\AcademicController@storeSemester');
    Route::middleware(['module_enabled:academics', 'permission:academics.organization.manage'])->get('academics/organization', 'Api\AcademicController@organizationTree');
    Route::middleware(['module_enabled:academics', 'permission:academics.subjects.view'])->get('academics/program-subjects', 'Api\AcademicController@programSubjects');
    Route::middleware(['module_enabled:academics', 'permission:academics.subjects.create'])->post('academics/program-subjects', 'Api\AcademicController@storeProgramSubject');
    Route::middleware(['module_enabled:academics', 'permission:academics.subjects.edit'])->put('academics/program-subjects/{programSubject}', 'Api\AcademicController@updateProgramSubject');
    Route::middleware(['module_enabled:academics', 'permission:academics.subjects.delete'])->delete('academics/program-subjects/{programSubject}', 'Api\AcademicController@destroyProgramSubject');

    Route::middleware(['module_enabled:academics', 'permission:academics.units.view'])->get('academics/units', 'Api\AcademicUnitController@index');
    Route::middleware(['module_enabled:academics', 'permission:academics.units.create'])->post('academics/units', 'Api\AcademicUnitController@store');
    Route::middleware(['module_enabled:academics', 'permission:academics.units.edit'])->put('academics/units/{academicUnit}', 'Api\AcademicUnitController@update');
    Route::middleware(['module_enabled:academics', 'permission:academics.units.delete'])->delete('academics/units/{academicUnit}', 'Api\AcademicUnitController@destroy');

    Route::middleware(['module_enabled:academics', 'permission:academics.view'])->get('academics/programs', 'Api\AcademicController@programs');
    Route::middleware(['module_enabled:academics', 'permission:academics.view'])->get('academics/programs/{programme}', 'Api\AcademicController@showProgram');
    Route::middleware(['module_enabled:academics', 'permission:academics.create'])->post('academics/programs', 'Api\AcademicController@storeProgram');
    Route::middleware(['module_enabled:academics', 'permission:academics.edit'])->put('academics/programs/{programme}', 'Api\AcademicController@updateProgram');
    Route::middleware(['module_enabled:academics', 'permission:academics.delete'])->delete('academics/programs/{programme}', 'Api\AcademicController@destroyProgram');

    Route::middleware(['module_enabled:academics', 'permission:academics.view'])->get('academics/subjects', 'Api\AcademicController@subjects');
    Route::middleware(['module_enabled:academics', 'permission:academics.create'])->post('academics/subjects', 'Api\AcademicController@storeSubject');
    Route::middleware(['module_enabled:academics', 'permission:academics.edit'])->put('academics/subjects/{subject}', 'Api\AcademicController@updateSubject');
    Route::middleware(['module_enabled:academics', 'permission:academics.delete'])->delete('academics/subjects/{subject}', 'Api\AcademicController@deleteSubject');

    Route::middleware(['module_enabled:academics', 'permission:academics.edit'])->put('academics/semesters/{semester}', 'Api\AcademicController@updateSemester');
    Route::middleware(['module_enabled:academics', 'permission:academics.edit'])->post('academics/programs/{programme}/levels', 'Api\AcademicController@storeLevel');
    Route::middleware(['module_enabled:academics', 'permission:academics.edit'])->put('academics/levels/{level}', 'Api\AcademicController@updateLevel');
    Route::middleware(['module_enabled:academics', 'permission:academics.edit'])->post('academics/programs/{programme}/semester-subjects', 'Api\AcademicController@assignSubject');
    Route::middleware(['module_enabled:academics', 'permission:academics.edit'])->put('academics/semester-subjects/{assignment}', 'Api\AcademicController@updateSemesterSubject');
    Route::middleware(['module_enabled:academics', 'permission:academics.edit'])->delete('academics/semester-subjects/{assignment}', 'Api\AcademicController@deleteSemesterSubject');

    Route::middleware(['auth:api', 'permission:fees.view|fees.manage'])->get('fees', 'Api\FeeController@index');
    Route::middleware(['auth:api'])->get('fees/my', 'Api\FeeController@myFees');
    Route::middleware(['auth:api', 'permission:fees.manage'])->post('fees/{fee}/payments', 'Api\FeeController@recordPayment');
    Route::middleware(['auth:api', 'permission:fees.manage'])->put('fees/semesters/{semester}', 'Api\FeeController@updateSemesterFee');
    Route::middleware(['auth:api', 'permission:fees.view|fees.manage'])->get('fees/reports/summary', 'Api\FeeController@reports');
    Route::middleware(['auth:api', 'permission:fees.view|fees.manage'])->get('fees/students/{student}/payment-history', 'Api\FeeController@paymentHistory');

    Route::middleware(['module_enabled:institutions', 'permission:institutions.settings'])->get('institutions/{id}/settings', 'Api\InstitutionController@getSettings');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.settings'])->put('institutions/{id}/settings', 'Api\InstitutionController@updateSettings');

    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->post('institutions/{id}/upload-logo', 'Api\InstitutionController@uploadLogo');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->post('institutions/{id}/upload-letterhead', 'Api\InstitutionController@uploadLetterhead');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->post('institutions/{id}/upload-signature', 'Api\InstitutionController@uploadSignature');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->post('institutions/{id}/upload-footer', 'Api\InstitutionController@uploadFooter');
    Route::middleware('permission:modules.view')->get('modules', 'Api\ModuleController@index');
    Route::middleware('permission:modules.manage')->get('institutions/{institution}/modules', 'Api\InstitutionModuleController@show');
    Route::middleware('permission:modules.manage')->put('institutions/{institution}/modules', 'Api\InstitutionModuleController@update');

    Route::prefix('letters')->group(function () {
        Route::get('counts', 'Api\Letters\LetterController@counts');
        Route::get('recipients/search', 'Api\Letters\LetterRecipientSearchController@search');
        Route::get('users/{user}/letter-workflow', 'Api\Letters\UserLetterWorkflowController@show');
        Route::post('users/{user}/letter-workflow', 'Api\Letters\UserLetterWorkflowController@update');
        Route::get('settings', 'Api\Letters\LetterSettingsController@show');
        Route::post('settings', 'Api\Letters\LetterSettingsController@update');
        Route::get('categories', 'Api\Letters\LetterCategoryController@index');
        Route::post('categories', 'Api\Letters\LetterCategoryController@store');
        Route::put('categories/{category}', 'Api\Letters\LetterCategoryController@update');
        Route::delete('categories/{category}', 'Api\Letters\LetterCategoryController@destroy');
        Route::get('templates', 'Api\Letters\LetterTemplateController@index');
        Route::post('templates', 'Api\Letters\LetterTemplateController@store');
        Route::put('templates/{template}', 'Api\Letters\LetterTemplateController@update');
        Route::delete('templates/{template}', 'Api\Letters\LetterTemplateController@destroy');
        Route::get('announcements/recipients/search', 'Api\Letters\AnnouncementRecipientSearchController@search');
        Route::get('announcements/templates', 'Api\Letters\AnnouncementTemplateController@index');
        Route::post('announcements/templates', 'Api\Letters\AnnouncementTemplateController@store');
        Route::put('announcements/templates/{announcementTemplate}', 'Api\Letters\AnnouncementTemplateController@update');
        Route::delete('announcements/templates/{announcementTemplate}', 'Api\Letters\AnnouncementTemplateController@destroy');
        Route::post('otp/request', 'Api\Letters\OtpController@request');
        Route::post('otp/verify', 'Api\Letters\OtpController@verify');
        Route::get('message-logs', 'Api\Letters\MessageLogController@index');
        Route::get('whatsapp-settings', 'Api\Letters\WhatsAppSettingsController@show');
        Route::put('whatsapp-settings', 'Api\Letters\WhatsAppSettingsController@update');
        Route::get('announcements', 'Api\Letters\AnnouncementController@index');
        Route::post('announcements/process-scheduled', 'Api\Letters\AnnouncementController@processScheduled');
        Route::post('announcements', 'Api\Letters\AnnouncementController@store');
        Route::post('announcements/preview', 'Api\Letters\AnnouncementController@preview');
        Route::get('announcements/{announcement}', 'Api\Letters\AnnouncementController@show');
        Route::put('announcements/{announcement}', 'Api\Letters\AnnouncementController@update');
        Route::post('announcements/{announcement}/send', 'Api\Letters\AnnouncementController@send');
        Route::delete('announcements/{announcement}', 'Api\Letters\AnnouncementController@destroy');
        Route::post('announcements/bulk-delete', 'Api\Letters\AnnouncementController@bulkDestroy');
        Route::get('signatures/list', 'Api\Letters\UserSignatureController@index');
        Route::post('signatures', 'Api\Letters\UserSignatureController@store');
        Route::get('/', 'Api\Letters\LetterController@index');
        Route::post('/', 'Api\Letters\LetterController@store');
        Route::post('bulk', 'Api\Letters\LetterController@bulk');
        Route::get('{letter}/preview', 'Api\Letters\LetterController@preview');
        Route::get('{letter}', 'Api\Letters\LetterController@show');
        Route::put('{letter}', 'Api\Letters\LetterController@update');
        Route::delete('{letter}', 'Api\Letters\LetterController@destroy');
        Route::post('{letter}/forward', 'Api\Letters\LetterController@forward');
        Route::post('{letter}/approve', 'Api\Letters\LetterController@approve');
        Route::post('{letter}/reject', 'Api\Letters\LetterController@reject');
        Route::post('{letter}/sign', 'Api\Letters\LetterController@sign');
        Route::post('{letter}/send', 'Api\Letters\LetterController@send');
    });

    Route::prefix('people')->group(function () {
        Route::get('recipients/search', 'Api\People\PeopleRecipientSearchController@search');
        Route::get('customers', 'Api\People\CustomerController@index');
        Route::post('customers', 'Api\People\CustomerController@store');
        Route::put('customers/{id}', 'Api\People\CustomerController@update');
        Route::delete('customers/{id}', 'Api\People\CustomerController@destroy');
        Route::get('billers', 'Api\People\BillerController@index');
        Route::post('billers', 'Api\People\BillerController@store');
        Route::put('billers/{id}', 'Api\People\BillerController@update');
        Route::delete('billers/{id}', 'Api\People\BillerController@destroy');
        Route::get('suppliers', 'Api\People\SupplierController@index');
        Route::post('suppliers', 'Api\People\SupplierController@store');
        Route::put('suppliers/{id}', 'Api\People\SupplierController@update');
        Route::delete('suppliers/{id}', 'Api\People\SupplierController@destroy');
        Route::get('students', 'Api\People\StudentController@index');
        Route::post('students', 'Api\People\StudentController@store');
        Route::put('students/{id}', 'Api\People\StudentController@update');
        Route::delete('students/{id}', 'Api\People\StudentController@destroy');
        Route::get('teachers', 'Api\People\TeacherController@index');
        Route::post('teachers', 'Api\People\TeacherController@store');
        Route::put('teachers/{id}', 'Api\People\TeacherController@update');
        Route::delete('teachers/{id}', 'Api\People\TeacherController@destroy');
        Route::get('staff', 'Api\People\StaffController@index');
        Route::post('staff', 'Api\People\StaffController@store');
        Route::put('staff/{id}', 'Api\People\StaffController@update');
        Route::delete('staff/{id}', 'Api\People\StaffController@destroy');
    });

    require base_path('app/Modules/Admissions/Routes/api.php');
    require base_path('app/Modules/Canteen/Routes/api.php');
    require base_path('app/Modules/CharacterCertificates/Routes/api.php');
    require base_path('app/Modules/Hr/Routes/api.php');
    require base_path('app/Modules/Hostel/Routes/api.php');
    require base_path('app/Modules/Tasks/Routes/api.php');
    require base_path('app/Modules/Attendance/Routes/api.php');

    Route::prefix('library')->group(function () {
        // Dashboard
        Route::get('dashboard', 'Api\Library\LibraryDashboardController@index');

        // Settings
        Route::get('settings', 'Api\Library\LibrarySettingsController@show');
        Route::put('settings', 'Api\Library\LibrarySettingsController@update');

        // Categories
        Route::get('categories', 'Api\Library\LibraryCategoryController@index');
        Route::post('categories', 'Api\Library\LibraryCategoryController@store');
        Route::put('categories/{id}', 'Api\Library\LibraryCategoryController@update');
        Route::delete('categories/{id}', 'Api\Library\LibraryCategoryController@destroy');

        // Books + search + availability + frequently signed
        Route::get('books', 'Api\Library\LibraryBookController@index');
        Route::get('books/search', 'Api\Library\LibraryBookController@search');
        Route::get('books/frequently-signed', 'Api\Library\LibraryBookController@frequentlySigned');
        Route::post('books', 'Api\Library\LibraryBookController@store');
        Route::get('books/{id}', 'Api\Library\LibraryBookController@show');
        Route::put('books/{id}', 'Api\Library\LibraryBookController@update');
        Route::post('books/{id}', 'Api\Library\LibraryBookController@update');
        Route::delete('books/{id}', 'Api\Library\LibraryBookController@destroy');

        // Reviews / ratings
        Route::get('books/{id}/reviews', 'Api\Library\LibraryReviewController@index');
        Route::post('books/{id}/reviews', 'Api\Library\LibraryReviewController@store');

        // Book copies
        Route::get('copies', 'Api\Library\LibraryBookCopyController@index');
        Route::get('copies/suggest-accession', 'Api\Library\LibraryBookCopyController@suggestAccession');
        Route::post('copies/bulk', 'Api\Library\LibraryBookCopyController@bulkStore');
        Route::post('copies', 'Api\Library\LibraryBookCopyController@store');
        Route::put('copies/{id}', 'Api\Library\LibraryBookCopyController@update');
        Route::delete('copies/{id}', 'Api\Library\LibraryBookCopyController@destroy');

        // Borrow lifecycle
        Route::get('borrow-requests', 'Api\Library\LibraryBorrowController@index');
        Route::post('borrow-requests', 'Api\Library\LibraryBorrowController@store');
        Route::get('borrow-requests/borrowed', 'Api\Library\LibraryBorrowController@borrowed');
        Route::get('borrow-requests/due-for-return', 'Api\Library\LibraryBorrowController@dueForReturn');
        Route::get('borrow-requests/overdue', 'Api\Library\LibraryBorrowController@overdue');
        Route::get('borrow-requests/history', 'Api\Library\LibraryBorrowController@history');
        Route::get('borrow-requests/scan/{token}', 'Api\Library\LibraryBorrowController@scan');
        Route::post('borrow-requests/bulk-reminder', 'Api\Library\LibraryBorrowController@bulkReminder');
        Route::get('borrow-requests/{id}', 'Api\Library\LibraryBorrowController@show');
        Route::post('borrow-requests/{id}/approve', 'Api\Library\LibraryBorrowController@approve');
        Route::post('borrow-requests/{id}/reject', 'Api\Library\LibraryBorrowController@reject');
        Route::post('borrow-requests/{id}/issue', 'Api\Library\LibraryBorrowController@issue');
        Route::post('borrow-requests/{id}/return', 'Api\Library\LibraryBorrowController@returnBook');
        Route::post('borrow-requests/{id}/lost-damaged', 'Api\Library\LibraryBorrowController@markLostOrDamaged');
        Route::post('borrow-requests/{id}/cancel', 'Api\Library\LibraryBorrowController@cancel');
        Route::post('borrow-requests/{id}/reminder', 'Api\Library\LibraryBorrowController@sendReminder');

        // Fines
        Route::get('fines', 'Api\Library\LibraryFineController@index');
        Route::post('fines/{id}/pay', 'Api\Library\LibraryFineController@markPaid');
        Route::post('fines/{id}/waive', 'Api\Library\LibraryFineController@waive');
    });
});
