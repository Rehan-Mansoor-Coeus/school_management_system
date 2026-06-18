<?php

use App\Permission;
use App\Role;
use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class SyncAllPermissionsSeeder extends Seeder
{
    public function run()
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $created = 0;
        foreach (PermissionCatalog::all() as $name) {
            $permission = Permission::firstOrCreate(
                ['name' => $name, 'guard_name' => 'api']
            );
            if ($permission->wasRecentlyCreated) {
                $created++;
            }
        }

        $allPermissionNames = Permission::query()
            ->where('guard_name', 'api')
            ->pluck('name')
            ->all();

        foreach (['super-admin', 'system-super-admin'] as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName], ['guard_name' => 'api']);
            $role->syncPermissions($allPermissionNames);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->command->info(sprintf(
            'Synced %d catalog permissions (%d newly created). Granted %d total permissions to super-admin roles.',
            count(PermissionCatalog::all()),
            $created,
            count($allPermissionNames)
        ));
    }
}
