<?php

namespace App\Http\Middleware;

use App\Institution;
use App\Support\AdminContext;
use App\Support\PlatformAccess;
use Closure;
use Illuminate\Http\Request;

class ResolveActiveInstitution
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        $requested = AdminContext::requestedInstitutionId($request);

        if (PlatformAccess::isPlatformSuperAdmin($user)) {
            if ($requested && ! Institution::where('id', $requested)->exists()) {
                return response()->json([
                    'message' => 'Selected institution was not found.',
                    'code' => 'INSTITUTION_NOT_FOUND',
                ], 404);
            }
            $request->attributes->set('admin_context_type', $requested ? 'institution' : 'platform');
            $request->attributes->set('active_institution_id', $requested);
        } else {
            $assigned = (int) ($user->institution_id ?: 0);
            if ($requested && $assigned && $requested !== $assigned) {
                return response()->json([
                    'message' => 'You are not authorized to access this institution.',
                    'code' => 'INSTITUTION_FORBIDDEN',
                ], 403);
            }
            $request->attributes->set('admin_context_type', 'institution');
            $request->attributes->set('active_institution_id', $assigned > 0 ? $assigned : null);
        }

        return $next($request);
    }
}
