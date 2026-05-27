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

Route::middleware('auth:api')->group(function () {
    Route::get('users', 'Api\UserController@index');
    Route::get('roles', 'Api\RoleController@index');
    Route::get('permissions', 'Api\PermissionController@index');

    Route::middleware('role:admin')->group(function () {
        Route::post('users', 'Api\UserController@store');
        Route::put('users/{user}', 'Api\UserController@update');
        Route::delete('users/{user}', 'Api\UserController@destroy');
        Route::post('users/{user}/roles', 'Api\UserController@assignRoles');
    });

    Route::middleware('role:super-admin')->group(function () {
        Route::post('roles', 'Api\RoleController@store');
        Route::put('roles/{role}', 'Api\RoleController@update');
        Route::delete('roles/{role}', 'Api\RoleController@destroy');
        Route::post('roles/{role}/permissions', 'Api\RoleController@assignPermissions');

        Route::post('permissions', 'Api\PermissionController@store');
        Route::put('permissions/{permission}', 'Api\PermissionController@update');
        Route::delete('permissions/{permission}', 'Api\PermissionController@destroy');
    });

    Route::prefix('timesheets')->group(function () {
        Route::get('activities', 'Api\TimesheetController@activities');
        Route::post('activities', 'Api\TimesheetController@storeActivity')->middleware('permission:timesheets.manage');

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
