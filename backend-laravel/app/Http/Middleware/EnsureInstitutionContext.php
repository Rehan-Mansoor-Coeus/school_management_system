<?php

namespace App\Http\Middleware;

use App\Support\AdminContext;
use Closure;
use Illuminate\Http\Request;

/**
 * Reject institution-operational API calls when no active institution is selected.
 * Platform super admins in platform context must switch into an institution first.
 */
class EnsureInstitutionContext
{
    public function handle(Request $request, Closure $next)
    {
        $id = AdminContext::activeInstitutionId($request);
        if (! $id) {
            return response()->json([
                'message' => 'Institution context required. Switch into an institution to continue.',
                'code' => 'INSTITUTION_CONTEXT_REQUIRED',
            ], 403);
        }

        return $next($request);
    }
}
