<?php

namespace App\Http\Middleware;

use App\Institution;
use App\Modules\Licensing\Services\LicenseAccessService;
use App\Support\AdminContext;
use App\Support\PlatformAccess;
use Closure;
use Illuminate\Http\Request;

class EnsureLicenseActive
{
    public function handle(Request $request, Closure $next, $moduleKey = null)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (PlatformAccess::isPlatformSuperAdmin($user)) {
            return $next($request);
        }

        $institutionId = AdminContext::activeInstitutionId($request, $user);
        if (! $institutionId) {
            return $next($request);
        }

        $institution = Institution::find($institutionId);
        if (! $institution) {
            return response()->json(['message' => 'Institution not found.'], 404);
        }

        $result = app(LicenseAccessService::class)->evaluate($institution, $moduleKey);
        if (! $result['allowed']) {
            return response()->json([
                'message' => $result['message'],
                'error_code' => $result['code'],
                'access_mode' => $result['mode'],
            ], 403);
        }

        return $next($request);
    }
}
