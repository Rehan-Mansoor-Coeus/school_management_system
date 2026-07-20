<?php

namespace App\Http\Middleware;

use App\Module;
use App\Support\AdminContext;
use App\Support\PlatformAccess;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnsureModuleEnabled
{
    public function handle(Request $request, Closure $next, $moduleKey)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Platform super admins bypass module gating. Operational controllers still
        // require an active institution context via AdminContext::requireInstitutionId().
        if (PlatformAccess::isPlatformSuperAdmin($user)) {
            return $next($request);
        }

        $institutionId = AdminContext::activeInstitutionId($request, $user);
        if (! $institutionId) {
            return response()->json(['message' => 'Institution not set for this user.'], 403);
        }

        $module = Module::where('key', $moduleKey)->first();
        if (! $module) {
            return response()->json(['message' => 'Module not found.'], 403);
        }

        $enabled = DB::table('institution_modules')
            ->where('institution_id', $institutionId)
            ->where('module_id', $module->id)
            ->value('enabled');

        if (! $enabled) {
            return response()->json(['message' => 'Module is disabled for this institution.'], 403);
        }

        return $next($request);
    }
}
