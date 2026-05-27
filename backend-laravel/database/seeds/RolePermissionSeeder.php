<?php

use App\Permission;
use App\Role;
use App\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin'], ['guard_name' => 'api']);
        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['guard_name' => 'api']);
        $teacherRole = Role::firstOrCreate(['name' => 'teacher'], ['guard_name' => 'api']);
        $studentRole = Role::firstOrCreate(['name' => 'student'], ['guard_name' => 'api']);
        $timesheetSupervisorRole = Role::firstOrCreate(['name' => 'time-sheet-supervisor'], ['guard_name' => 'api']);
        $hrOfficerRole = Role::firstOrCreate(['name' => 'hr-officer'], ['guard_name' => 'api']);
        $institutionAdminRole = Role::firstOrCreate(['name' => 'institution-admin'], ['guard_name' => 'api']);
        $staffRole = Role::firstOrCreate(['name' => 'staff'], ['guard_name' => 'api']);
        $hodRole = Role::firstOrCreate(['name' => 'head-of-department'], ['guard_name' => 'api']);
        $courseMasterRole = Role::firstOrCreate(['name' => 'course-master'], ['guard_name' => 'api']);

        $legacyPermissions = [
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'roles.manage',
            'permissions.manage',
            'timesheets.view_own',
            'timesheets.create_entry',
            'timesheets.submit',
            'timesheets.review',
            'timesheets.report',
            'timesheets.manage',
            'timesheets.manage_shift_types',
            'timesheets.manage_teacher_availability',
            'timesheets.manage_staff_schedules',
            'timesheets.manage_course_contact_hours',
            'timesheets.generate_timetable_suggestions',
            'timesheets.approve_timetable_suggestions',
            'timesheets.assign_teacher_schedules',
            'timesheets.view_teacher_schedules',
            'timesheets.submit_teaching_timesheets',
            'timesheets.submit_staff_timesheets',
            'timesheets.approve_timesheets',
            'timesheets.reject_timesheets',
            'timesheets.view_timesheet_reports',
            'timesheets.view_course_hour_reports',
            'timesheets.manage_course_hour_plans',
        ];

        $timesheetPermissions = [
            'manage_shift_types',
            'manage_teacher_availability',
            'manage_staff_schedules',
            'manage_course_contact_hours',
            'generate_timetable_suggestions',
            'approve_timetable_suggestions',
            'assign_teacher_schedules',
            'view_teacher_schedules',
            'submit_teaching_timesheets',
            'submit_staff_timesheets',
            'approve_timesheets',
            'reject_timesheets',
            'request_timesheet_correction',
            'view_timesheet_reports',
            'view_course_hour_reports',
            'manage_course_hour_plans',
            'manage_timesheet_notifications',
        ];

        $allPermissions = array_unique(array_merge($legacyPermissions, $timesheetPermissions));

        foreach ($allPermissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName], ['guard_name' => 'api']);
        }

        $institutionFull = array_merge(
            $timesheetPermissions,
            [
                'timesheets.manage',
                'timesheets.report',
                'timesheets.review',
                'timesheets.manage_shift_types',
                'timesheets.manage_teacher_availability',
                'timesheets.manage_staff_schedules',
                'timesheets.manage_course_contact_hours',
                'timesheets.generate_timetable_suggestions',
                'timesheets.approve_timetable_suggestions',
                'timesheets.assign_teacher_schedules',
                'timesheets.view_teacher_schedules',
                'timesheets.submit_teaching_timesheets',
                'timesheets.submit_staff_timesheets',
                'timesheets.approve_timesheets',
                'timesheets.reject_timesheets',
                'timesheets.view_timesheet_reports',
                'timesheets.view_course_hour_reports',
                'timesheets.manage_course_hour_plans',
            ]
        );

        $superAdmin->syncPermissions($allPermissions);
        $adminRole->syncPermissions(['users.view', 'users.create', 'users.edit', 'users.delete']);
        $teacherRole->syncPermissions([
            'users.view',
            'view_teacher_schedules',
            'submit_teaching_timesheets',
            'timesheets.view_teacher_schedules',
            'timesheets.submit_teaching_timesheets',
            'timesheets.view_own',
        ]);
        $studentRole->syncPermissions([]);
        $timesheetSupervisorRole->syncPermissions([
            'approve_timesheets',
            'reject_timesheets',
            'request_timesheet_correction',
            'view_timesheet_reports',
            'timesheets.review',
            'timesheets.report',
            'timesheets.approve_timesheets',
            'timesheets.reject_timesheets',
            'timesheets.view_timesheet_reports',
        ]);
        $hrOfficerRole->syncPermissions([
            'manage_staff_schedules',
            'submit_staff_timesheets',
            'approve_timesheets',
            'view_timesheet_reports',
            'manage_timesheet_notifications',
            'timesheets.review',
            'timesheets.report',
            'timesheets.manage',
            'timesheets.manage_staff_schedules',
            'timesheets.submit_staff_timesheets',
            'timesheets.approve_timesheets',
            'timesheets.view_timesheet_reports',
        ]);
        $institutionAdminRole->syncPermissions($institutionFull);
        $staffRole->syncPermissions([
            'submit_staff_timesheets',
            'timesheets.view_own',
            'timesheets.create_entry',
            'timesheets.submit',
            'timesheets.submit_staff_timesheets',
        ]);
        $hodRole->syncPermissions([
            'view_teacher_schedules',
            'assign_teacher_schedules',
            'manage_teacher_availability',
            'approve_timesheets',
            'reject_timesheets',
            'request_timesheet_correction',
            'view_timesheet_reports',
            'view_course_hour_reports',
            'timesheets.view_teacher_schedules',
            'timesheets.assign_teacher_schedules',
            'timesheets.manage_teacher_availability',
            'timesheets.approve_timesheets',
            'timesheets.reject_timesheets',
            'timesheets.view_timesheet_reports',
            'timesheets.view_course_hour_reports',
        ]);
        $courseMasterRole->syncPermissions([
            'manage_course_hour_plans',
            'manage_course_contact_hours',
            'generate_timetable_suggestions',
            'approve_timetable_suggestions',
            'assign_teacher_schedules',
            'view_teacher_schedules',
            'manage_teacher_availability',
            'view_course_hour_reports',
            'approve_timesheets',
            'timesheets.manage_course_hour_plans',
            'timesheets.manage_course_contact_hours',
            'timesheets.generate_timetable_suggestions',
            'timesheets.approve_timetable_suggestions',
            'timesheets.assign_teacher_schedules',
            'timesheets.view_teacher_schedules',
            'timesheets.manage_teacher_availability',
            'timesheets.view_course_hour_reports',
            'timesheets.approve_timesheets',
        ]);

        $admin = User::updateOrCreate(
            ['email' => 'admin@test.com'],
            [
                'institution_id' => 1,
                'name' => 'Test Admin',
                'password' => Hash::make('admin123'),
                'api_token' => Str::random(60),
                'locale' => 'en',
            ]
        );

        if (! $admin->hasRole($superAdmin)) {
            $admin->assignRole($superAdmin);
        }
    }
}
