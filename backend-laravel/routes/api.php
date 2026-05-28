<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', 'Api\AuthController@register');
    Route::post('login', 'Api\AuthController@login');

    Route::middleware('auth:api')->group(function () {
        Route::post('logout', 'Api\AuthController@logout');
        Route::get('user', 'Api\AuthController@me');
    });
});

Route::middleware('auth:api')->get('me', 'Api\AuthController@me');

Route::middleware('auth:api')->group(function () {
    Route::middleware(['module_enabled:users', 'permission:users.view|view_users|manage_users'])->get('users', 'Api\UserController@index');
    Route::middleware(['module_enabled:roles', 'permission:roles.view|view_roles|manage_roles|roles.manage'])->get('roles', 'Api\RoleController@index');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.view|view_permissions|manage_roles|permissions.manage'])->get('permissions', 'Api\PermissionController@index');

    Route::middleware(['module_enabled:users', 'permission:users.create|create_users|manage_users'])->post('users', 'Api\UserController@store');
    Route::middleware(['module_enabled:users', 'permission:users.edit|edit_users|manage_users'])->put('users/{user}', 'Api\UserController@update');
    Route::middleware(['module_enabled:users', 'permission:users.delete|delete_users|manage_users'])->delete('users/{user}', 'Api\UserController@destroy');
    Route::middleware(['module_enabled:users', 'permission:users.edit|edit_users|manage_users'])->post('users/{user}/roles', 'Api\UserController@assignRoles');

    Route::middleware(['module_enabled:roles', 'permission:roles.create|create_roles|manage_roles|roles.manage'])->post('roles', 'Api\RoleController@store');
    Route::middleware(['module_enabled:roles', 'permission:roles.edit|edit_roles|manage_roles|roles.manage'])->put('roles/{role}', 'Api\RoleController@update');
    Route::middleware(['module_enabled:roles', 'permission:roles.delete|delete_roles|manage_roles|roles.manage'])->delete('roles/{role}', 'Api\RoleController@destroy');
    Route::middleware(['module_enabled:roles', 'permission:roles.edit|assign_permissions|manage_roles|roles.manage'])->post('roles/{role}/permissions', 'Api\RoleController@assignPermissions');

    Route::middleware(['module_enabled:permissions', 'permission:permissions.create|manage_roles|permissions.manage'])->post('permissions', 'Api\PermissionController@store');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.edit|manage_roles|permissions.manage'])->put('permissions/{permission}', 'Api\PermissionController@update');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.delete|manage_roles|permissions.manage'])->delete('permissions/{permission}', 'Api\PermissionController@destroy');

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
});
