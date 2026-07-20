<?php

namespace App\Http\Middleware;

use App\Support\PlatformAccess;
use Closure;
use Illuminate\Http\Request;

class EnsurePlatformSuperAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! PlatformAccess::isPlatformSuperAdmin($user)) {
            return response()->json(['message' => 'Unauthorized. Platform super admin access required.'], 403);
        }

        return $next($request);
    }
}
