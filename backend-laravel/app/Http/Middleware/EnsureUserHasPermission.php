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

        $permissions = explode('|', $permission);

        foreach ($permissions as $name) {
            if ($user->hasPermissionTo($name)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Unauthorized. Missing required permission: ' . implode(' or ', $permissions),
        ], 403);
    }
}
