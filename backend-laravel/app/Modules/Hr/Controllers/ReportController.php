<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except([]);
        $this->middleware('module_enabled:hr');
    }


    public function summary(Request $request)
    {
        $institutionId = $this->institutionId();
        $month = $request->get('month');

        $byMonthQuery = \App\Modules\Hr\Models\HrPayrollRun::where('institution_id', $institutionId)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as period, SUM(total_net) as total_net, SUM(total_gross) as total_gross")
            ->groupBy('period')
            ->orderBy('period', 'desc');
        if ($month) {
            $byMonthQuery->whereRaw("DATE_FORMAT(created_at, '%Y-%m') = ?", [$month]);
        }

        $data = [
            'byMonth' => $byMonthQuery->get(),
            'unpaidTotal' => \App\Modules\Hr\Models\HrPayrollItem::whereHas('payrollRun', function ($query) use ($institutionId) {
                $query->where('institution_id', $institutionId);
            })->whereIn('payment_status', ['pending', 'approved_for_payment', 'partially_paid'])->sum('net_amount'),
            'allowances' => \DB::table('hr_payroll_allowances')
                ->join('hr_payroll_items', 'hr_payroll_items.id', '=', 'hr_payroll_allowances.payroll_item_id')
                ->join('hr_payroll_runs', 'hr_payroll_runs.id', '=', 'hr_payroll_items.payroll_run_id')
                ->where('hr_payroll_runs.institution_id', $institutionId)
                ->selectRaw('label, SUM(amount) as total')
                ->groupBy('label')
                ->orderBy('total', 'desc')
                ->get(),
            'deductions' => \DB::table('hr_payroll_deductions')
                ->join('hr_payroll_items', 'hr_payroll_items.id', '=', 'hr_payroll_deductions.payroll_item_id')
                ->join('hr_payroll_runs', 'hr_payroll_runs.id', '=', 'hr_payroll_items.payroll_run_id')
                ->where('hr_payroll_runs.institution_id', $institutionId)
                ->selectRaw('label, SUM(amount) as total')
                ->groupBy('label')
                ->orderBy('total', 'desc')
                ->get(),
        ];

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function staffHistory($staffId)
    {
        $staff = \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $this->institutionId())->findOrFail($staffId);
        $rows = \App\Modules\Hr\Models\HrPayrollItem::where('staff_profile_id', $staff->id)->orderBy('id', 'desc')->get();

        return response()->json(['success' => true, 'data' => $rows]);
    }

}
