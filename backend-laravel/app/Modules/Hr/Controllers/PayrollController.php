<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except([]);
        $this->middleware('module_enabled:hr');
    }


    public function index(Request $request)
    {
        $query = \App\Modules\Hr\Models\HrPayrollRun::where('institution_id', $this->institutionId());
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($request->filled('run_type')) {
            $query->where('run_type', $request->get('run_type'));
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('id', 'desc')->get()]);
    }

    public function show($id)
    {
        $run = \App\Modules\Hr\Models\HrPayrollRun::where('institution_id', $this->institutionId())->findOrFail($id);
        $run->load('items');

        return response()->json(['success' => true, 'data' => $run]);
    }

    public function createFromJob($jobId, \App\Modules\Hr\Services\HrPayrollService $service)
    {
        $run = $service->createFromJob($this->institutionId(), $jobId, auth()->id());

        return response()->json(['success' => true, 'data' => $run], 201);
    }

    public function createMonthly(Request $request, \App\Modules\Hr\Services\HrPayrollService $service)
    {
        $payload = $request->validate([
            'period_start' => 'required|date',
            'period_end' => 'required|date',
            'title' => 'nullable|string|max:255',
        ]);

        $run = $service->createMonthly(
            $this->institutionId(),
            $payload['period_start'],
            $payload['period_end'],
            isset($payload['title']) ? $payload['title'] : null,
            auth()->id()
        );

        return response()->json(['success' => true, 'data' => $run], 201);
    }

    public function updateItem(Request $request, $runId, $itemId, \App\Modules\Hr\Services\HrPayrollCalculator $calculator)
    {
        $run = \App\Modules\Hr\Models\HrPayrollRun::where('institution_id', $this->institutionId())->findOrFail($runId);
        $item = \App\Modules\Hr\Models\HrPayrollItem::where('payroll_run_id', $run->id)->findOrFail($itemId);
        $payload = $request->validate([
            'allowances' => 'nullable|array',
            'deductions' => 'nullable|array',
            'days_worked' => 'nullable|numeric',
            'daily_rate' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        \App\Modules\Hr\Models\HrPayrollAllowance::where('payroll_item_id', $item->id)->delete();
        \App\Modules\Hr\Models\HrPayrollDeduction::where('payroll_item_id', $item->id)->delete();

        $allowances = isset($payload['allowances']) ? $payload['allowances'] : [];
        foreach ($allowances as $allowance) {
            \App\Modules\Hr\Models\HrPayrollAllowance::create([
                'payroll_item_id' => $item->id,
                'allowance_type_id' => isset($allowance['allowance_type_id']) ? $allowance['allowance_type_id'] : null,
                'label' => isset($allowance['label']) ? $allowance['label'] : 'Allowance',
                'amount' => isset($allowance['amount']) ? $allowance['amount'] : 0,
            ]);
        }

        $deductions = isset($payload['deductions']) ? $payload['deductions'] : [];
        foreach ($deductions as $deduction) {
            \App\Modules\Hr\Models\HrPayrollDeduction::create([
                'payroll_item_id' => $item->id,
                'deduction_type_id' => isset($deduction['deduction_type_id']) ? $deduction['deduction_type_id'] : null,
                'label' => isset($deduction['label']) ? $deduction['label'] : 'Deduction',
                'amount' => isset($deduction['amount']) ? $deduction['amount'] : 0,
            ]);
        }

        $dailyRate = isset($payload['daily_rate']) ? (float) $payload['daily_rate'] : (float) $item->daily_rate;
        $daysWorked = isset($payload['days_worked']) ? (float) $payload['days_worked'] : (float) $item->days_worked;
        $basic = $item->payment_status === 'pending' && $dailyRate > 0 ? $dailyRate * $daysWorked : $item->basic_amount;

        $totals = $calculator->calcItemTotals([
            'basic' => $basic,
            'allowances' => $allowances,
            'deductions' => $deductions,
            'advances' => $item->total_advances,
        ]);

        $item->update([
            'basic_amount' => $totals['basic'],
            'daily_rate' => $dailyRate,
            'days_worked' => $daysWorked,
            'gross_amount' => $totals['gross'],
            'total_allowances' => $totals['totalAllowances'],
            'total_deductions' => $totals['totalDeductions'],
            'net_amount' => $totals['net'],
            'notes' => isset($payload['notes']) ? $payload['notes'] : $item->notes,
        ]);

        $run->update([
            'total_gross' => \App\Modules\Hr\Models\HrPayrollItem::where('payroll_run_id', $run->id)->sum('gross_amount'),
            'total_net' => \App\Modules\Hr\Models\HrPayrollItem::where('payroll_run_id', $run->id)->sum('net_amount'),
        ]);

        return response()->json(['success' => true, 'data' => $item->fresh()]);
    }

    public function submitReview(Request $request, $id, \App\Modules\Hr\Services\HrPayrollService $service)
    {
        $run = $service->submit($this->institutionId(), $id, auth()->id(), $request->get('notes'));

        return response()->json(['success' => true, 'data' => $run]);
    }

    public function approve(Request $request, $id, \App\Modules\Hr\Services\HrPayrollService $service)
    {
        $run = $service->approve($this->institutionId(), $id, auth()->id(), $request->get('notes'));

        return response()->json(['success' => true, 'data' => $run]);
    }

    public function forwardFinance(Request $request, $id, \App\Modules\Hr\Services\HrPayrollService $service)
    {
        $run = $service->forward($this->institutionId(), $id, auth()->id(), $request->get('notes'));

        return response()->json(['success' => true, 'data' => $run]);
    }

    public function reject(Request $request, $id, \App\Modules\Hr\Services\HrPayrollService $service)
    {
        $run = $service->reject($this->institutionId(), $id, auth()->id(), $request->get('notes'));

        return response()->json(['success' => true, 'data' => $run]);
    }

}
