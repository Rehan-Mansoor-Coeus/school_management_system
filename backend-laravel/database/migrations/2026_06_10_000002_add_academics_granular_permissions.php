<?php

use App\Permission;
use App\Role;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\PermissionRegistrar;

class AddAcademicsGranularPermissions extends Migration
{
    public function up()
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $granular = ['academics.create', 'academics.edit', 'academics.delete'];

        foreach ($granular as $name) {
            Permission::firstOrCreate(['name' => $name], ['guard_name' => 'api']);
        }

        $manageRoles = Role::whereHas('permissions', function ($query) {
            $query->where('name', 'academics.manage');
        })->get();

        foreach ($manageRoles as $role) {
            $role->givePermissionTo($granular);
        }

        $superRoles = Role::whereIn('name', ['super-admin', 'system-super-admin', 'admin', 'institution-admin'])->get();
        foreach ($superRoles as $role) {
            $role->givePermissionTo(array_merge(['academics.view'], $granular, ['academics.manage']));
        }
    }

    public function down()
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (['academics.create', 'academics.edit', 'academics.delete'] as $name) {
            Permission::where('name', $name)->where('guard_name', 'api')->delete();
        }
    }
}
