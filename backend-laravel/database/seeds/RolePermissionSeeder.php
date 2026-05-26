<?php

use App\Permission;
use App\Role;
use App\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin'], ['guard_name' => 'api']);
        $adminRole = Role::firstOrCreate(['name' => 'admin'], ['guard_name' => 'api']);
        $teacherRole = Role::firstOrCreate(['name' => 'teacher'], ['guard_name' => 'api']);
        $studentRole = Role::firstOrCreate(['name' => 'student'], ['guard_name' => 'api']);

        $permissions = [
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'roles.manage',
            'permissions.manage',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName], ['guard_name' => 'api']);
        }

        $superAdmin->syncPermissions($permissions);
        $adminRole->syncPermissions(['users.view', 'users.create', 'users.edit', 'users.delete']);
        $teacherRole->syncPermissions(['users.view']);
        $studentRole->syncPermissions([]);

        $admin = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'api_token' => Str::random(60),
            ]
        );

        $admin->assignRole($superAdmin);
    }
}
