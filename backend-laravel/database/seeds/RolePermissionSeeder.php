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
            ['name' => 'Default Institution', 'is_active' => true]
        );

        $modules = [
            ['key' => 'users', 'name' => 'Users', 'sort_order' => 10],
            ['key' => 'roles', 'name' => 'Roles', 'sort_order' => 20],
            ['key' => 'permissions', 'name' => 'Permissions', 'sort_order' => 30],
            ['key' => 'institutions', 'name' => 'Institutions', 'sort_order' => 40],
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
        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['guard_name' => 'api']);
        $teacherRole = Role::firstOrCreate(['name' => 'teacher'], ['guard_name' => 'api']);
        $studentRole = Role::firstOrCreate(['name' => 'student'], ['guard_name' => 'api']);

        $permissions = [
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'permissions.view',
            'permissions.create',
            'permissions.edit',
            'permissions.delete',
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

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName], ['guard_name' => 'api']);
        }

        $superAdmin->syncPermissions($permissions);
        $adminRole->syncPermissions([
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'permissions.view',
            'institutions.view',
            'modules.view',
        ]);
        $teacherRole->syncPermissions(['users.view']);
        $studentRole->syncPermissions([]);

        $admin = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'api_token' => Str::random(60),
                'institution_id' => $defaultInstitution->id,
                'is_active' => true,
            ]
        );

        $admin->assignRole($superAdmin);
    }
}
