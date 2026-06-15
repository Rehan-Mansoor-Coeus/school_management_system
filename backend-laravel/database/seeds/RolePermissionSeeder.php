<?php

use App\Institution;
use App\Module;
use App\Permission;
use App\Role;
use App\User;
use App\AcademicYear;
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
            ['key' => 'letters', 'name' => 'Letters & Announcements', 'sort_order' => 55],
            ['key' => 'admissions', 'name' => 'Admissions', 'sort_order' => 100],
            ['key' => 'academics', 'name' => 'Academics', 'sort_order' => 110],
            ['key' => 'attendance', 'name' => 'Attendance', 'sort_order' => 120],
            ['key' => 'tasks', 'name' => 'Task Manager', 'sort_order' => 125],
            ['key' => 'results', 'name' => 'Results', 'sort_order' => 130],
            ['key' => 'fees', 'name' => 'Fees & Payments', 'sort_order' => 140],
            ['key' => 'hr', 'name' => 'HR & Payroll', 'sort_order' => 150],
            ['key' => 'assets', 'name' => 'Assets', 'sort_order' => 160],
            ['key' => 'library', 'name' => 'Library', 'sort_order' => 170],
            ['key' => 'hostel', 'name' => 'Hostel', 'sort_order' => 180],
            ['key' => 'canteen', 'name' => 'Canteen', 'sort_order' => 190],
            ['key' => 'character_certificates', 'name' => 'Character Certificates', 'sort_order' => 195],
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
        $registryRole = Role::firstOrCreate(['name' => 'registry'], ['guard_name' => 'api']);
        $registrarRole = Role::firstOrCreate(['name' => 'registrar'], ['guard_name' => 'api']);
        $hodAdmissionRole = Role::firstOrCreate(['name' => 'hod'], ['guard_name' => 'api']);
        $financeOfficerRole = Role::firstOrCreate(['name' => 'finance-officer'], ['guard_name' => 'api']);

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
            'admissions.apply',
            'admissions.registry.review',
            'admissions.department.review',
            'admissions.registrar.admit',
            'admissions.finance.verify',
            'admissions.courses.register',
            'admissions.hod.approve',
            'academics.view',
            'academics.create',
            'academics.edit',
            'academics.delete',
            'academics.manage',
            'academics.create',
            'academics.edit',
            'academics.delete',
            'academics.units.view',
            'academics.units.create',
            'academics.units.edit',
            'academics.units.delete',
            'academics.departments.view',
            'academics.departments.create',
            'academics.departments.edit',
            'academics.departments.delete',
            'academics.programs.view',
            'academics.programs.create',
            'academics.programs.edit',
            'academics.programs.delete',
            'academics.semesters.view',
            'academics.semesters.create',
            'academics.semesters.edit',
            'academics.semesters.delete',
            'academics.subjects.view',
            'academics.subjects.create',
            'academics.subjects.edit',
            'academics.subjects.delete',
            'academics.organization.manage',
            'attendance.view',
            'attendance.manage',
            'results.view',
            'results.manage',
            'fees.view',
            'fees.manage',
            'hr.view',
            'hr.manage',
            'hr.payroll.approve',
            'hr.finance',
            'tasks.view',
            'tasks.create',
            'tasks.manage',
            'tasks.assign',
            'assets.view',
            'assets.manage',
            'library.view',
            'library.manage',
            'hostel.view',
            'hostel.manage',
            'hostel.allocate',
            'hostel.payments',
            'hostel.maintenance',
            'hostel.clearance',
            'canteen.view',
            'canteen.manage',
            'canteen.verify',
            'canteen.reports',
            'character_certificates.view',
            'character_certificates.manage',
            'character_certificates.finance_clear',
            'character_certificates.library_clear',
            'character_certificates.issue',
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

        $lettersPermissions = [
            'view_letters_menu',
            'create_letters',
            'edit_letters',
            'edit_awaiting_letters',
            'delete_letters',
            'send_letter_to_editor',
            'forward_letter_to_approver',
            'forward_letter_to_signer',
            'approve_letters',
            'reject_letters',
            'sign_letters',
            'bulk_sign_letters',
            'send_letters',
            'bulk_send_letters',
            'view_awaiting_editing',
            'view_awaiting_approval',
            'view_awaiting_signature',
            'view_ready_to_send_letters',
            'view_sent_letters',
            'print_letters',
            'download_letters',
            'manage_letter_settings',
            'manage_letter_categories',
            'manage_letter_templates',
            'view_announcements',
            'create_announcements',
            'send_announcements',
            'send_whatsapp_announcements',
            'schedule_announcements',
            'manage_announcement_recipients',
            'view_people_menu',
            'view_customers',
            'create_customers',
            'edit_customers',
            'delete_customers',
            'view_billers',
            'create_billers',
            'edit_billers',
            'delete_billers',
            'view_suppliers',
            'create_suppliers',
            'edit_suppliers',
            'delete_suppliers',
            'view_students',
            'create_students',
            'edit_students',
            'delete_students',
        ];

        $allPermissions = array_values(array_unique(array_merge($accessPermissions, $legacyTimesheetPermissions, $timesheetPermissions, $lettersPermissions)));
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

            'academics.view', 'academics.manage', 'academics.create', 'academics.edit', 'academics.delete',
            'academics.units.view', 'academics.units.create', 'academics.units.edit', 'academics.units.delete',
            'academics.departments.view', 'academics.departments.create', 'academics.departments.edit', 'academics.departments.delete',
            'academics.programs.view', 'academics.programs.create', 'academics.programs.edit', 'academics.programs.delete',
            'academics.semesters.view', 'academics.semesters.create', 'academics.semesters.edit', 'academics.semesters.delete',
            'academics.subjects.view', 'academics.subjects.create', 'academics.subjects.edit', 'academics.subjects.delete',
            'academics.organization.manage',

            'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
            'view_students', 'create_students', 'edit_students', 'delete_students',
        ];

        $institutionAdminPermissions = array_merge(
            $fullAccessControl,
            $timesheetPermissions,
            $adminTimesheetPermissions,
            $legacyTimesheetPermissions,
            $lettersPermissions,
            ['admissions.view', 'admissions.manage', 'admissions.registry.review', 'admissions.department.review', 'admissions.registrar.admit', 'admissions.finance.verify', 'admissions.hod.approve', 'canteen.view', 'canteen.manage', 'canteen.verify', 'canteen.reports', 'character_certificates.view', 'character_certificates.manage', 'character_certificates.finance_clear', 'character_certificates.library_clear', 'character_certificates.issue', 'hostel.view', 'hostel.manage', 'hostel.allocate', 'hostel.payments', 'hostel.maintenance', 'hostel.clearance', 'hr.view', 'hr.manage', 'hr.payroll.approve', 'hr.finance', 'tasks.view', 'tasks.create', 'tasks.manage', 'tasks.assign', 'attendance.view', 'attendance.manage']
        );

        $adminPermissions = array_merge($fullAccessControl, $adminTimesheetPermissions, $lettersPermissions, [
            'admissions.view',
            'admissions.manage',
            'admissions.registry.review',
            'admissions.department.review',
            'admissions.registrar.admit',
            'admissions.finance.verify',
            'admissions.hod.approve',
            'admissions.courses.register',
            'canteen.view',
            'canteen.manage',
            'canteen.verify',
            'canteen.reports',
            'character_certificates.view',
            'character_certificates.manage',
            'character_certificates.finance_clear',
            'character_certificates.library_clear',
            'character_certificates.issue',
            'hostel.view',
            'hostel.manage',
            'hostel.allocate',
            'hostel.payments',
            'hostel.maintenance',
            'hostel.clearance',
            'timesheets.manage',
            'timesheets.report',
            'timesheets.review',
            'timesheets.view_own',
            'timesheets.create_entry',
            'timesheets.submit',
            'timesheets.approve_timesheets',
            'timesheets.reject_timesheets',
            'timesheets.view_timesheet_reports',
            'hr.view',
            'hr.manage',
            'hr.payroll.approve',
            'hr.finance',
            'tasks.view',
            'tasks.create',
            'tasks.manage',
            'tasks.assign',
            'attendance.view',
            'attendance.manage',
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
            'tasks.view',
            'tasks.assign',
            'attendance.view',
        ]));

        $studentRole->syncPermissions([
            'admissions.apply',
            'admissions.courses.register',
            'canteen.view',
            'character_certificates.view',
            'hostel.view',
            'view_library_menu',
            'view_books',
            'borrow_books',
            'view_own_borrow_requests',
            'view_frequently_signed_books',
            'rate_books',
            'comment_on_books',
        ]);

        $admissionsStaffPermissions = ['admissions.view', 'admissions.manage'];
        $registryRole->syncPermissions(array_merge($admissionsStaffPermissions, ['admissions.registry.review']));
        $registrarRole->syncPermissions(array_merge($admissionsStaffPermissions, ['admissions.registrar.admit', 'character_certificates.view', 'character_certificates.manage', 'character_certificates.issue']));
        $hodAdmissionRole->syncPermissions(array_merge($admissionsStaffPermissions, ['admissions.department.review', 'admissions.hod.approve', 'admissions.courses.register']));
        $financeOfficerRole->syncPermissions(array_merge($admissionsStaffPermissions, [
            'admissions.finance.verify',
            'fees.view',
            'fees.manage',
            'character_certificates.view',
            'character_certificates.finance_clear',
            'hostel.view',
            'hostel.payments',
            'hr.view',
            'hr.finance',
            'tasks.view',
        ]));

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
            'hr.view',
            'hr.manage',
            'hr.payroll.approve',
            'tasks.view',
            'tasks.create',
            'tasks.manage',
            'tasks.assign',
            'attendance.view',
            'attendance.manage',
        ]));

        $staffRole->syncPermissions(array_merge($employeePermissions, [
            'submit_staff_timesheets',
            'timesheets.view_own',
            'timesheets.create_entry',
            'timesheets.submit',
            'timesheets.submit_staff_timesheets',
            'canteen.verify',
            'canteen.view',
            'tasks.view',
            'tasks.assign',
            'attendance.view',
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
            'admissions.view',
            'admissions.department.review',
            'admissions.hod.approve',
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
                'status' => 'active',
                'locale' => 'en',
            ]
        );

        if (! $admin->hasRole($superAdmin)) {
            $admin->assignRole($superAdmin);
        }

        // Seed a demo teacher and student for every institution so they are
        // visible in Access Control regardless of which institution the
        // logged-in admin belongs to (Users are scoped by institution_id).
        foreach (Institution::all() as $institution) {
            $isDefault = $institution->id === $defaultInstitution->id;
            $teacherEmail = $isDefault ? 'teacher@test.com' : 'teacher.inst' . $institution->id . '@test.com';
            $studentEmail = $isDefault ? 'student@test.com' : 'student.inst' . $institution->id . '@test.com';

            $teacher = User::updateOrCreate(
                ['email' => $teacherEmail],
                [
                    'institution_id' => $institution->id,
                    'name' => 'Test Teacher',
                    'password' => Hash::make('teacher123'),
                    'api_token' => Str::random(60),
                    'status' => 'active',
                    'locale' => 'en',
                ]
            );

            if (! $teacher->hasRole($teacherRole)) {
                $teacher->assignRole($teacherRole);
            }

            $student = User::updateOrCreate(
                ['email' => $studentEmail],
                [
                    'institution_id' => $institution->id,
                    'name' => 'Test Student',
                    'password' => Hash::make('student123'),
                    'api_token' => Str::random(60),
                    'status' => 'active',
                    'locale' => 'en',
                ]
            );

            if (! $student->hasRole($studentRole)) {
                $student->assignRole($studentRole);
            }

            $this->seedAdmissionsStaff($institution);
        }
    }

    protected function seedAdmissionsStaff(Institution $institution)
    {
        $staff = [
            ['email' => 'registry.inst'.$institution->id.'@test.com', 'name' => 'Registry Officer', 'role' => 'registry', 'password' => 'registry123'],
            ['email' => 'registrar.inst'.$institution->id.'@test.com', 'name' => 'Registrar', 'role' => 'registrar', 'password' => 'registrar123'],
            ['email' => 'hod.inst'.$institution->id.'@test.com', 'name' => 'Head of Department', 'role' => 'hod', 'password' => 'hod123'],
            ['email' => 'finance.inst'.$institution->id.'@test.com', 'name' => 'Finance Officer', 'role' => 'finance-officer', 'password' => 'finance123'],
        ];

        if ($institution->code === 'DEF') {
            $staff[0]['email'] = 'registry@test.com';
            $staff[1]['email'] = 'registrar@test.com';
            $staff[2]['email'] = 'hod@test.com';
            $staff[3]['email'] = 'finance@test.com';
        }

        foreach ($staff as $entry) {
            $user = User::updateOrCreate(
                ['email' => $entry['email']],
                [
                    'institution_id' => $institution->id,
                    'name' => $entry['name'],
                    'password' => Hash::make($entry['password']),
                    'api_token' => Str::random(60),
                    'status' => 'active',
                    'locale' => 'en',
                ]
            );

            if (! $user->hasRole($entry['role'])) {
                $user->assignRole(Role::where('name', $entry['role'])->first());
            }
        }

        AcademicYear::firstOrCreate(
            ['institution_id' => $institution->id, 'code' => 'AY'.date('Y').'-'.$institution->id],
            [
                'name' => date('Y').'/'.(date('Y') + 1),
                'start_year' => (int) date('Y'),
                'end_year' => (int) date('Y') + 1,
                'start_date' => date('Y').'-09-01',
                'end_date' => (date('Y') + 1).'-08-31',
                'is_active' => true,
                'is_current' => true,
            ]
        );
    }
}
