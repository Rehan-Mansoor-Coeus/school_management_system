<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Institution;
use App\Services\InstitutionStatsService;
use App\Support\AdminContext;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    protected $stats;

    public function __construct(InstitutionStatsService $stats)
    {
        $this->stats = $stats;
    }

    /**
     * School-scoped dashboard for the active institution context.
     * Institution admins use their assigned school; platform super admins
     * must have switched into an institution first.
     */
    public function show(Request $request)
    {
        $institutionId = AdminContext::activeInstitutionId($request);

        if (! $institutionId) {
            return response()->json([
                'message' => 'Institution context required.',
                'code' => 'INSTITUTION_CONTEXT_REQUIRED',
            ], 403);
        }

        $institution = Institution::find($institutionId);

        if (! $institution) {
            return response()->json(['message' => 'Institution not found.'], 404);
        }

        return response()->json($this->stats->forInstitution($institution));
    }
}
