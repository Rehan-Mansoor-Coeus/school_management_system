<?php

use App\Permission;
use App\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class GrantAllPermissionsToRoleSeeder extends Seeder
{
    public function run()
    {
        $roleId = 1;

        /** @var Role|null $role */
        $role = Role::find($roleId);
        if (! $role) {
            $this->command->error("Role not found for id={$roleId}");
            return;
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissionNames = Permission::query()
            ->where('guard_name', $role->guard_name)
            ->pluck('name')
            ->all();

        $role->syncPermissions($permissionNames);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->command->info("Granted " . count($permissionNames) . " permissions to role #{$roleId} ({$role->name}).");
    }
}

