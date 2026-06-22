<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Modules\Admissions\Models\Application;
use Illuminate\Support\Facades\DB;

class AdmissionsAdminDashboardController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:registry|registrar|finance-officer|hod|head-of-department|institution-admin|admin|super-admin|system-super-admin');
    }

    public function index()
    {
        $institutionId = $this->institutionId();
        $base = Application::query()->where('institution_id', $institutionId);

        $byStatus = (clone $base)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $activeStatuses = [
            'submitted', 'registry_reviewed', 'department_approved',
            'admitted', 'accepted', 'tuition_paid',
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'total_applications' => (clone $base)->count(),
                'active_applications' => (clone $base)->whereIn('status', $activeStatuses)->count(),
                'enrolled_count' => (int) ($byStatus['enrolled'] ?? 0),
                'pending_fee_count' => (clone $base)->where('status', 'submitted')->where('application_fee_paid', false)->count(),
                'by_status' => $byStatus,
                'pipeline' => [
                    'submitted' => (int) ($byStatus['submitted'] ?? 0),
                    'registry_reviewed' => (int) ($byStatus['registry_reviewed'] ?? 0),
                    'department_approved' => (int) ($byStatus['department_approved'] ?? 0),
                    'admitted' => (int) ($byStatus['admitted'] ?? 0),
                    'accepted' => (int) ($byStatus['accepted'] ?? 0),
                    'tuition_paid' => (int) ($byStatus['tuition_paid'] ?? 0),
                    'enrolled' => (int) ($byStatus['enrolled'] ?? 0),
                    'rejected' => (int) ($byStatus['rejected'] ?? 0),
                    'cancelled' => (int) ($byStatus['cancelled'] ?? 0),
                ],
            ],
        ]);
    }
}
