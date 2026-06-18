<?php

namespace App\Http\Middleware;

use App\Permission;
use Closure;

class EnsureUserHasPermission
{
    public function handle($request, Closure $next, $permission)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $permissions = array_map('trim', explode('|', $permission));

        foreach ($permissions as $name) {
            if ($this->userHasPermission($user, $name)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Unauthorized. Missing required permission: '.implode(' or ', $permissions),
        ], 403);
    }

    protected function userHasPermission($user, string $name): bool
    {
        if ($this->permissionExists($name) && $user->hasPermissionTo($name)) {
            return true;
        }

        $parts = explode('.', $name, 2);
        $module = $parts[0] ?? null;
        $action = $parts[1] ?? null;

        if (! $module || ! $action) {
            return false;
        }

        $managePermission = $module.'.manage';
        if (in_array($action, ['view', 'create', 'edit', 'delete'], true)
            && $this->permissionExists($managePermission)
            && $user->hasPermissionTo($managePermission)) {
            return true;
        }

        return false;
    }

    protected function permissionExists(string $name): bool
    {
        return Permission::where('name', $name)->where('guard_name', 'api')->exists();
    }
}
