<?php

namespace App\Http\Middleware;

use Closure;

class EnsureUserHasRole
{
    public function handle($request, Closure $next, $role)
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole($role)) {
            return response()->json(['message' => 'Unauthorized. This action requires the ' . $role . ' role.'], 403);
        }

        return $next($request);
    }
}
