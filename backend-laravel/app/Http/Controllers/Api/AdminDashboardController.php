<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Institution;
use App\Services\InstitutionStatsService;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    protected $stats;

    public function __construct(InstitutionStatsService $stats)
    {
        $this->stats = $stats;
    }

    /**
     * School-scoped dashboard for the currently authenticated user.
     * Always resolves to the caller's own institution, so a school admin
     * can never see another school's data through this endpoint.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (! $user || ! $user->institution_id) {
            return response()->json(['message' => 'No institution assigned to this user.'], 404);
        }

        $institution = Institution::find($user->institution_id);

        if (! $institution) {
            return response()->json(['message' => 'Institution not found.'], 404);
        }

        return response()->json($this->stats->forInstitution($institution));
    }
}
