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
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $userRole = Role::firstOrCreate(['name' => 'user']);

        $manageUsers = Permission::firstOrCreate(['name' => 'manage_users']);
        $manageRoles = Permission::firstOrCreate(['name' => 'manage_roles']);
        $viewDashboard = Permission::firstOrCreate(['name' => 'view_dashboard']);

        $adminRole->permissions()->syncWithoutDetaching([$manageUsers->id, $manageRoles->id, $viewDashboard->id]);
        $userRole->permissions()->syncWithoutDetaching([$viewDashboard->id]);

        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'api_token' => Str::random(60),
            ]
        );

        $admin->roles()->syncWithoutDetaching([$adminRole->id]);
    }
}
