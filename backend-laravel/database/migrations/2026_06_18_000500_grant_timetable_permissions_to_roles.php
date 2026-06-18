<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;

/**
 * Registers the Timetable & Courses permissions and grants them to the relevant
 * roles. This is purely ADDITIVE (givePermissionTo, never sync) so existing
 * custom permission assignments are preserved.
 */
class GrantTimetablePermissionsToRoles extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('permissions') || ! Schema::hasTable('roles')) {
            return;
        }

        $permissionModel = config('permission.models.permission', \Spatie\Permission\Models\Permission::class);
        $roleModel = config('permission.models.role', \Spatie\Permission\Models\Role::class);

        $full = [
            'timetable.view', 'timetable.create', 'timetable.edit', 'timetable.delete', 'timetable.manage',
            'timetable.courses.view', 'timetable.courses.manage',
            'timetable.assignments.view', 'timetable.assignments.manage',
            'timetable.classrooms.view', 'timetable.classrooms.manage',
            'timetable.availability.view', 'timetable.availability.manage',
            'timetable.workload.view', 'timetable.generate', 'timetable.approve',
            'timetable.lessons.view', 'timetable.lessons.log',
            'timetable.reports.view', 'timetable.settings.manage', 'timetable.student.view',
        ];

        // Ensure every permission exists (api guard).
        foreach ($full as $name) {
            $permissionModel::firstOrCreate(['name' => $name, 'guard_name' => 'api']);
        }

        // Ensure the dean role exists.
        $roleModel::firstOrCreate(['name' => 'dean', 'guard_name' => 'api']);

        $hod = [
            'timetable.view', 'timetable.create', 'timetable.edit', 'timetable.delete',
            'timetable.courses.view', 'timetable.courses.manage',
            'timetable.assignments.view', 'timetable.assignments.manage',
            'timetable.classrooms.view',
            'timetable.availability.view', 'timetable.availability.manage',
            'timetable.workload.view', 'timetable.generate',
            'timetable.lessons.view', 'timetable.reports.view', 'timetable.student.view',
        ];

        $courseMaster = [
            'timetable.view', 'timetable.create', 'timetable.edit',
            'timetable.courses.view', 'timetable.courses.manage',
            'timetable.assignments.view', 'timetable.assignments.manage',
            'timetable.classrooms.view',
            'timetable.availability.view', 'timetable.availability.manage',
            'timetable.workload.view', 'timetable.generate',
            'timetable.lessons.view', 'timetable.reports.view',
        ];

        $dean = [
            'timetable.view', 'timetable.approve', 'timetable.courses.view',
            'timetable.assignments.view', 'timetable.classrooms.view',
            'timetable.availability.view', 'timetable.workload.view',
            'timetable.lessons.view', 'timetable.reports.view', 'timetable.student.view',
        ];

        $teacher = [
            'timetable.view', 'timetable.lessons.view', 'timetable.lessons.log',
            'timetable.availability.view', 'timetable.student.view',
        ];

        $student = ['timetable.student.view'];

        $grants = [
            'super-admin' => $full,
            'system-super-admin' => $full,
            'admin' => $full,
            'institution-admin' => $full,
            'registrar' => $full,
            'head-of-department' => $hod,
            'hod' => $hod,
            'course-master' => $courseMaster,
            'dean' => $dean,
            'teacher' => $teacher,
            'student' => $student,
        ];

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($grants as $roleName => $permissions) {
            $role = $roleModel::where('name', $roleName)->where('guard_name', 'api')->first();
            if (! $role) {
                continue;
            }

            foreach ($permissions as $permission) {
                try {
                    $role->givePermissionTo($permission);
                } catch (\Throwable $e) {
                    // Skip any permission that can't be granted rather than failing the deploy.
                }
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down()
    {
        // No-op: revoking would risk removing permissions an admin set manually.
    }
}
