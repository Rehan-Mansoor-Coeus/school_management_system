<?php

namespace App\Console\Commands;

use App\Permission;
use App\Role;
use Illuminate\Console\Command;
use Spatie\Permission\PermissionRegistrar;

class GrantAllPermissionsToRole extends Command
{
    protected $signature = 'permissions:grant-all {roleId=1 : Role id to grant all permissions to}';

    protected $description = 'Grant (sync) all permissions to the given role id';

    public function handle()
    {
        $roleId = (int) $this->argument('roleId');

        /** @var Role|null $role */
        $role = Role::find($roleId);
        if (! $role) {
            $this->error("Role not found for id={$roleId}");
            return 1;
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissionNames = Permission::query()
            ->where('guard_name', $role->guard_name)
            ->pluck('name')
            ->all();

        $role->syncPermissions($permissionNames);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->info("Granted " . count($permissionNames) . " permissions to role #{$roleId} ({$role->name}).");
        return 0;
    }
}

