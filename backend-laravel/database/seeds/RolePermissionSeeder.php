<?php

use App\Institution;
use App\Module;
use App\Permission;
use App\Role;
use App\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $defaultInstitution = Institution::firstOrCreate(
            ['code' => 'DEF'],
            [
                'name' => 'Default Institution',
                'type' => 'school',
                'is_active' => true,
            ]
        );

        $modules = [
            ['key' => 'users', 'name' => 'Users', 'sort_order' => 10],
            ['key' => 'roles', 'name' => 'Roles', 'sort_order' => 20],
            ['key' => 'permissions', 'name' => 'Permissions', 'sort_order' => 30],
            ['key' => 'institutions', 'name' => 'Institutions', 'sort_order' => 40],
            ['key' => 'departments', 'name' => 'Departments', 'sort_order' => 45],
            ['key' => 'timesheets', 'name' => 'Timesheets', 'sort_order' => 50],
            ['key' => 'admissions', 'name' => 'Admissions', 'sort_order' => 100],
            ['key' => 'academics', 'name' => 'Academics', 'sort_order' => 110],
            ['key' => 'attendance', 'name' => 'Attendance', 'sort_order' => 120],
            ['key' => 'results', 'name' => 'Results', 'sort_order' => 130],
            ['key' => 'fees', 'name' => 'Fees & Payments', 'sort_order' => 140],
            ['key' => 'hr', 'name' => 'HR & Payroll', 'sort_order' => 150],
            ['key' => 'assets', 'name' => 'Assets', 'sort_order' => 160],
            ['key' => 'library', 'name' => 'Library', 'sort_order' => 170],
            ['key' => 'hostel', 'name' => 'Hostel', 'sort_order' => 180],
            ['key' => 'canteen', 'name' => 'Canteen', 'sort_order' => 190],
            ['key' => 'notifications', 'name' => 'Notifications', 'sort_order' => 200],
            ['key' => 'audit', 'name' => 'Audit Logs', 'sort_order' => 210],
            ['key' => 'modules', 'name' => 'Module Settings', 'sort_order' => 1000],
        ];

        foreach ($modules as $moduleData) {
            Module::firstOrCreate(['key' => $moduleData['key']], $moduleData + ['is_active' => true]);
        }

        $allModules = Module::all();
        foreach (Institution::all() as $institution) {
            foreach ($allModules as $module) {
                DB::table('institution_modules')->updateOrInsert(
                    ['institution_id' => $institution->id, 'module_id' => $module->id],
                    ['enabled' => true, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }

        $superAdmin = Role::firstOrCreate(['name' => 'super-admin'], ['guard_name' => 'api']);
        $systemSuperAdmin = Role::firstOrCreate(['name' => 'system-super-admin'], ['guard_name' => 'api']);
        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['guard_name' => 'api']);
        $teacherRole = Role::firstOrCreate(['name' => 'teacher'], ['guard_name' => 'api']);
        $studentRole = Role::firstOrCreate(['name' => 'student'], ['guard_name' => 'api']);
        $timesheetSupervisorRole = Role::firstOrCreate(['name' => 'time-sheet-supervisor'], ['guard_name' => 'api']);
        $hrOfficerRole = Role::firstOrCreate(['name' => 'hr-officer'], ['guard_name' => 'api']);
        $institutionAdminRole = Role::firstOrCreate(['name' => 'institution-admin'], ['guard_name' => 'api']);
        $staffRole = Role::firstOrCreate(['name' => 'staff'], ['guard_name' => 'api']);
        $hodRole = Role::firstOrCreate(['name' => 'head-of-department'], ['guard_name' => 'api']);
        $courseMasterRole = Role::firstOrCreate(['name' => 'course-master'], ['guard_name' => 'api']);

        $accessPermissions = [
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'view_users',
            'create_users',
            'edit_users',
            'delete_users',
            'manage_users',
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'roles.manage',
            'view_roles',
            'create_roles',
            'edit_roles',
            'delete_roles',
            'manage_roles',
            'permissions.view',
            'permissions.create',
            'permissions.edit',
            'permissions.delete',
            'permissions.manage',
            'view_permissions',
            'assign_permissions',
            'institutions.view',
            'institutions.create',
            'institutions.edit',
            'institutions.delete',
            'institutions.settings',
            'modules.view',
            'modules.manage',
            'admissions.view',
            'admissions.manage',
            'academics.view',
            'academics.manage',
            'attendance.view',
            'attendance.manage',
            'results.view',
            'results.manage',
            'fees.view',
            'fees.manage',
            'hr.view',
            'hr.manage',
            'assets.view',
            'assets.manage',
            'library.view',
            'library.manage',
            'hostel.view',
            'hostel.manage',
            'canteen.view',
            'canteen.manage',
            'notifications.view',
            'notifications.manage',
            'audit.view',
            'audit.manage',
        ];

        $legacyTimesheetPermissions = [
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
            'view_timesheet_menu',
            'manage_timesheet_categories',
            'create_timesheet_activity',
            'fill_timesheet',
            'manage_own_working_week',
            'view_own_timesheet',
            'edit_own_timesheet',
            'delete_own_timesheet',
            'view_all_timesheets',
            'view_overtime_reports',
            'export_timesheet_reports',
        ];

        $allPermissions = array_values(array_unique(array_merge($accessPermissions, $legacyTimesheetPermissions, $timesheetPermissions)));
        sort($allPermissions);

        foreach ($allPermissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName], ['guard_name' => 'api']);
        }
        $adminRole->syncPermissions([
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'permissions.view',
            'institutions.view',
            'modules.view',
        ]);
        $teacherRole->syncPermissions(['users.view']);
        $employeePermissions = [
            'view_timesheet_menu',
            'create_timesheet_activity',
            'fill_timesheet',
            'manage_own_working_week',
            'view_own_timesheet',
            'edit_own_timesheet',
            'delete_own_timesheet',
        ];

        $adminTimesheetPermissions = array_merge($employeePermissions, [
            'manage_timesheet_categories',
            'view_all_timesheets',
            'approve_timesheets',
            'reject_timesheets',
            'view_timesheet_reports',
            'view_overtime_reports',
            'export_timesheet_reports',
        ]);

        $fullAccessControl = [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'view_users', 'create_users', 'edit_users', 'delete_users', 'manage_users',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.manage',
            'view_roles', 'create_roles', 'edit_roles', 'delete_roles', 'manage_roles',
            'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete', 'permissions.manage',
            'view_permissions', 'assign_permissions',
            'institutions.view', 'institutions.create', 'institutions.edit', 'institutions.delete', 'institutions.settings',
            'modules.view', 'modules.manage',
        ];

        $institutionAdminPermissions = array_merge(
            $fullAccessControl,
            $timesheetPermissions,
            $adminTimesheetPermissions,
            $legacyTimesheetPermissions
        );

        $adminPermissions = array_merge($fullAccessControl, $adminTimesheetPermissions, [
            'timesheets.manage',
            'timesheets.report',
            'timesheets.review',
            'timesheets.view_own',
            'timesheets.create_entry',
            'timesheets.submit',
            'timesheets.approve_timesheets',
            'timesheets.reject_timesheets',
            'timesheets.view_timesheet_reports',
        ]);

        $superAdmin->syncPermissions($allPermissions);
        $systemSuperAdmin->syncPermissions($allPermissions);
        $adminRole->syncPermissions($adminPermissions);
        $institutionAdminRole->syncPermissions($institutionAdminPermissions);

        $teacherRole->syncPermissions(array_merge($employeePermissions, [
            'users.view',
            'view_teacher_schedules',
            'submit_teaching_timesheets',
            'timesheets.view_teacher_schedules',
            'timesheets.submit_teaching_timesheets',
            'timesheets.view_own',
        ]));

        $studentRole->syncPermissions([]);

        $timesheetSupervisorRole->syncPermissions(array_merge($adminTimesheetPermissions, [
            'request_timesheet_correction',
            'timesheets.review',
            'timesheets.report',
            'timesheets.approve_timesheets',
            'timesheets.reject_timesheets',
            'timesheets.view_timesheet_reports',
        ]));

        $hrOfficerRole->syncPermissions(array_merge($adminTimesheetPermissions, [
            'manage_staff_schedules',
            'submit_staff_timesheets',
            'manage_timesheet_notifications',
            'timesheets.review',
            'timesheets.report',
            'timesheets.manage',
            'timesheets.manage_staff_schedules',
            'timesheets.submit_staff_timesheets',
            'timesheets.approve_timesheets',
            'timesheets.view_timesheet_reports',
        ]));

        $staffRole->syncPermissions(array_merge($employeePermissions, [
            'submit_staff_timesheets',
            'timesheets.view_own',
            'timesheets.create_entry',
            'timesheets.submit',
            'timesheets.submit_staff_timesheets',
        ]));

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
                'institution_id' => $defaultInstitution->id,
                'name' => 'Test Admin',
                'password' => Hash::make('admin123'),
                'api_token' => Str::random(60),
                'institution_id' => $defaultInstitution->id,
                'is_active' => true,
                'locale' => 'en',
            ]
        );

        if (! $admin->hasRole($superAdmin)) {
            $admin->assignRole($superAdmin);
        }
    }
}
