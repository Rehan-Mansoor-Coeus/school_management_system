<?php

namespace App\Http\Middleware;

use Closure;

class EnsureUserHasPermission
{
    public function handle($request, Closure $next, $permission)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        if ($user->hasRole('super-admin')) {
            return $next($request);
        }

        $permissions = explode('|', $permission);

        foreach ($permissions as $name) {
            if ($user->hasPermissionTo(trim($name))) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Unauthorized. Missing required permission: ' . implode(' or ', $permissions),
        ], 403);
    }
}
