<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class PayslipController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except(['verify']);
        $this->middleware('module_enabled:hr');
    }


    public function index()
    {
        $data = \App\Modules\Hr\Models\HrPayslip::query()
            ->whereHas('payrollItem.payrollRun', function ($query) {
                $query->where('institution_id', $this->institutionId());
            })
            ->orderBy('generated_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function generate($itemId, \App\Modules\Hr\Services\HrPayrollService $service)
    {
        $payslip = $service->generatePayslip($this->institutionId(), $itemId);

        return response()->json(['success' => true, 'data' => $payslip]);
    }

    public function detail($itemId)
    {
        $item = \App\Modules\Hr\Models\HrPayrollItem::whereHas('payrollRun', function ($query) {
            $query->where('institution_id', $this->institutionId());
        })->findOrFail($itemId);

        $data = [
            'item' => $item,
            'allowances' => \App\Modules\Hr\Models\HrPayrollAllowance::where('payroll_item_id', $item->id)->get(),
            'deductions' => \App\Modules\Hr\Models\HrPayrollDeduction::where('payroll_item_id', $item->id)->get(),
            'payslip' => \App\Modules\Hr\Models\HrPayslip::where('payroll_item_id', $item->id)->first(),
        ];

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function verify($code)
    {
        $key = strtoupper(trim((string) $code));
        $payslip = \App\Modules\Hr\Models\HrPayslip::whereRaw('UPPER(verification_code) = ?', [$key])->first();

        if (! $payslip) {
            return response()->json(['success' => false, 'data' => ['valid' => false]], 404);
        }

        $item = \App\Modules\Hr\Models\HrPayrollItem::find($payslip->payroll_item_id);
        $run = $item ? \App\Modules\Hr\Models\HrPayrollRun::find($item->payroll_run_id) : null;
        $staff = $item ? \App\Modules\Hr\Models\HrStaffProfile::find($item->staff_profile_id) : null;

        return response()->json([
            'success' => true,
            'data' => [
                'valid' => true,
                'verification_code' => $payslip->verification_code,
                'employee_name' => trim((string) optional($staff)->first_name . ' ' . optional($staff)->last_name),
                'staff_code' => optional($staff)->staff_code,
                'position' => optional($staff)->position,
                'payroll_title' => optional($run)->title,
                'net_amount' => optional($item)->net_amount,
                'generated_at' => $payslip->generated_at,
            ],
        ]);
    }

}
