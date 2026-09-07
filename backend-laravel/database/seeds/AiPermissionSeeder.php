<?php

use App\Permission;
use App\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class AiPermissionSeeder extends Seeder
{
    public function run()
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (['ai.chat', 'ai.knowledge.manage', 'ai.analytics.view'] as $name) {
            Permission::firstOrCreate(['name' => $name], ['guard_name' => 'api']);
        }

        $chatRoles = [
            'system-super-admin', 'super-admin', 'institution-admin', 'admin',
            'student', 'teacher', 'staff', 'registry', 'registrar',
            'finance-officer', 'hod', 'head-of-department', 'hr-officer',
        ];
        foreach ($chatRoles as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();
            if ($role && ! $role->hasPermissionTo('ai.chat')) {
                $role->givePermissionTo('ai.chat');
            }
        }

        foreach (['system-super-admin', 'super-admin'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();
            if (! $role) {
                continue;
            }
            foreach (['ai.knowledge.manage', 'ai.analytics.view'] as $perm) {
                if (! $role->hasPermissionTo($perm)) {
                    $role->givePermissionTo($perm);
                }
            }
        }
    }
}
