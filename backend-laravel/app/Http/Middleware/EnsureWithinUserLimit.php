<?php

namespace App\Http\Middleware;

use App\Institution;
use App\Modules\Licensing\Services\LicenseAccessService;
use App\Support\AdminContext;
use App\Support\PlatformAccess;
use Closure;
use Illuminate\Http\Request;

class EnsureWithinUserLimit
{
    public function handle(Request $request, Closure $next, $kind = 'users')
    {
        $user = $request->user();
        if (! $user || PlatformAccess::isPlatformSuperAdmin($user)) {
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

        $result = app(LicenseAccessService::class)->evaluateUserLimit($institution, $kind);
        if (! $result['allowed']) {
            return response()->json([
                'message' => $result['message'],
                'error_code' => $result['code'],
            ], 403);
        }

        return $next($request);
    }
}
