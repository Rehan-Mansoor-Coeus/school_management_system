<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except([]);
        $this->middleware('module_enabled:hr');
    }


    public function index()
    {
        $institutionId = $this->institutionId();

        return response()->json([
            'success' => true,
            'data' => [
                'staff_count' => \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $institutionId)->count(),
                'active_staff' => \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $institutionId)->where('status', 'active')->count(),
                'jobs_count' => \App\Modules\Hr\Models\HrJob::where('institution_id', $institutionId)->count(),
                'open_advances' => \App\Modules\Hr\Models\HrAdvancePayment::where('institution_id', $institutionId)->where('status', 'open')->sum('balance_remaining'),
                'payroll_runs' => \App\Modules\Hr\Models\HrPayrollRun::where('institution_id', $institutionId)->count(),
            ],
        ]);
    }

}
