<?php

use App\Modules\Timetable\Controllers\ClassroomController;
use App\Modules\Timetable\Controllers\CourseAssignmentController;
use App\Modules\Timetable\Controllers\CourseController;
use App\Modules\Timetable\Controllers\LessonLogController;
use App\Modules\Timetable\Controllers\OptionsController;
use App\Modules\Timetable\Controllers\ReportController;
use App\Modules\Timetable\Controllers\SettingController;
use App\Modules\Timetable\Controllers\StudentTimetableController;
use App\Modules\Timetable\Controllers\TeacherAvailabilityController;
use App\Modules\Timetable\Controllers\TimetableController;
use App\Modules\Timetable\Controllers\WorkloadController;
use Illuminate\Support\Facades\Route;

Route::prefix('timetable')->group(function () {
    Route::middleware(['auth:api', 'module_enabled:timetable'])->group(function () {
        $view = 'permission:timetable.view|timetable.manage';
        $manage = 'permission:timetable.edit|timetable.create|timetable.manage';
        $delete = 'permission:timetable.delete|timetable.manage';

        $coursesView = 'permission:timetable.courses.view|timetable.view|timetable.manage';
        $coursesManage = 'permission:timetable.courses.manage|timetable.manage';
        $coursesDelete = 'permission:timetable.courses.manage|timetable.delete|timetable.manage';

        $assignView = 'permission:timetable.assignments.view|timetable.view|timetable.manage';
        $assignManage = 'permission:timetable.assignments.manage|timetable.manage';
        $assignDelete = 'permission:timetable.assignments.manage|timetable.delete|timetable.manage';

        $roomsView = 'permission:timetable.classrooms.view|timetable.view|timetable.manage';
        $roomsManage = 'permission:timetable.classrooms.manage|timetable.manage';
        $roomsDelete = 'permission:timetable.classrooms.manage|timetable.delete|timetable.manage';

        $availView = 'permission:timetable.availability.view|timetable.view|timetable.manage';
        $availManage = 'permission:timetable.availability.manage|timetable.manage';

        $workloadView = 'permission:timetable.workload.view|timetable.view|timetable.manage';
        $generate = 'permission:timetable.generate|timetable.manage';
        $approve = 'permission:timetable.approve|timetable.manage';

        $lessonsView = 'permission:timetable.lessons.view|timetable.manage';
        $lessonsLog = 'permission:timetable.lessons.log|timetable.lessons.view|timetable.manage';

        $reports = 'permission:timetable.reports.view|timetable.view|timetable.manage';
        $settingsView = 'permission:timetable.settings.manage|timetable.view|timetable.manage';
        $settingsManage = 'permission:timetable.settings.manage|timetable.manage';
        $studentView = 'permission:timetable.student.view|timetable.view|timetable.manage';

        // Shared dropdown options
        Route::middleware($view)->get('options', [OptionsController::class, 'index']);

        // Courses
        Route::middleware($coursesView)->get('courses', [CourseController::class, 'index']);
        Route::middleware($coursesView)->get('courses/{id}', [CourseController::class, 'show']);
        Route::middleware($coursesManage)->post('courses', [CourseController::class, 'store']);
        Route::middleware($coursesManage)->put('courses/{id}', [CourseController::class, 'update']);
        Route::middleware($coursesDelete)->delete('courses/{id}', [CourseController::class, 'destroy']);

        // Course assignments
        Route::middleware($assignView)->get('assignments', [CourseAssignmentController::class, 'index']);
        Route::middleware($assignManage)->post('assignments', [CourseAssignmentController::class, 'store']);
        Route::middleware($assignManage)->put('assignments/{id}', [CourseAssignmentController::class, 'update']);
        Route::middleware($assignDelete)->delete('assignments/{id}', [CourseAssignmentController::class, 'destroy']);

        // Classrooms
        Route::middleware($roomsView)->get('classrooms', [ClassroomController::class, 'index']);
        Route::middleware($roomsManage)->post('classrooms', [ClassroomController::class, 'store']);
        Route::middleware($roomsManage)->put('classrooms/{id}', [ClassroomController::class, 'update']);
        Route::middleware($roomsDelete)->delete('classrooms/{id}', [ClassroomController::class, 'destroy']);

        // Teacher availability
        Route::middleware($availView)->get('availability', [TeacherAvailabilityController::class, 'index']);
        Route::middleware($availManage)->post('availability', [TeacherAvailabilityController::class, 'store']);

        // Teacher workload
        Route::middleware($workloadView)->get('workload', [WorkloadController::class, 'index']);

        // Timetable entries
        Route::middleware($view)->get('entries', [TimetableController::class, 'index']);
        Route::middleware($view)->post('entries/check-conflicts', [TimetableController::class, 'checkConflicts']);
        Route::middleware($manage)->post('entries', [TimetableController::class, 'store']);
        Route::middleware($manage)->put('entries/{id}', [TimetableController::class, 'update']);
        Route::middleware($delete)->delete('entries/{id}', [TimetableController::class, 'destroy']);
        Route::middleware($approve)->post('entries/{id}/approve', [TimetableController::class, 'approve']);
        Route::middleware($generate)->post('generate', [TimetableController::class, 'generate']);

        // Lesson logs / contact-hour tracking
        Route::middleware($lessonsLog)->get('lessons', [LessonLogController::class, 'index']);
        Route::middleware($lessonsLog)->post('lessons', [LessonLogController::class, 'store']);
        Route::middleware($lessonsLog)->delete('lessons/{id}', [LessonLogController::class, 'destroy']);

        // Student timetable
        Route::middleware($studentView)->get('student/me', [StudentTimetableController::class, 'mine']);
        Route::middleware($view)->get('student/{studentId}', [StudentTimetableController::class, 'show']);

        // Reports
        Route::middleware($reports)->get('reports', [ReportController::class, 'index']);

        // Settings
        Route::middleware($settingsView)->get('settings', [SettingController::class, 'show']);
        Route::middleware($settingsManage)->put('settings', [SettingController::class, 'update']);
    });
});
