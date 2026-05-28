<?php

namespace App\Http\Middleware;

use Closure;

class EnsureUserHasRole
{
    public function handle($request, Closure $next, $role)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        if ($user->hasRole('super-admin')) {
            return $next($request);
        }

        $roles = explode('|', $role);

        foreach ($roles as $name) {
            if ($user->hasRole(trim($name))) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Unauthorized. This action requires one of these roles: ' . implode(', ', $roles),
        ], 403);
    }
}
