<?php

namespace App\Http\Middleware;

use App\Support\PlatformAccess;
use Closure;

class EnsureUserHasRole
{
    protected $rolePermissionMap = [
        'registry' => ['admissions.registry.review', 'admissions.view', 'admissions.manage'],
        'registrar' => ['admissions.registrar.admit', 'admissions.view', 'admissions.manage'],
        'finance-officer' => ['admissions.finance.verify', 'fees.view', 'fees.manage', 'admissions.view', 'admissions.manage'],
        'hod' => ['admissions.department.review', 'admissions.hod.approve', 'admissions.view', 'admissions.manage'],
        'head-of-department' => ['admissions.department.review', 'admissions.hod.approve', 'admissions.view', 'admissions.manage'],
        'institution-admin' => ['institutions.view', 'institutions.edit', 'institutions.settings', 'users.view', 'roles.view', 'permissions.view', 'admissions.manage'],
        'admin' => ['users.view', 'roles.view', 'permissions.view', 'modules.view', 'modules.manage', 'admissions.manage', 'admissions.view'],
        'super-admin' => ['admissions.manage'],
        'system-super-admin' => ['admissions.manage'],
    ];

    public function handle($request, Closure $next, $role)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        if ($user->hasAnyRole(PlatformAccess::PLATFORM_SUPER_ADMIN_ROLES)
            || $user->can('admissions.manage')) {
            return $next($request);
        }

        $roles = array_map('trim', explode('|', $role));

        foreach ($roles as $name) {
            if ($user->hasRole($name)) {
                return $next($request);
            }
        }

        foreach ($roles as $name) {
            foreach ($this->permissionsForRole($name) as $permission) {
                if ($user->hasPermissionTo($permission)) {
                    return $next($request);
                }
            }
        }

        return response()->json([
            'message' => 'Unauthorized. This action requires one of these roles: '.implode(', ', $roles),
        ], 403);
    }

    protected function permissionsForRole(string $roleName): array
    {
        return $this->rolePermissionMap[$roleName] ?? [];
    }
}
