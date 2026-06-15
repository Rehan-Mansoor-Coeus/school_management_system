<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except([]);
        $this->middleware('module_enabled:hr');
    }


    public function index(Request $request)
    {
        $query = \App\Modules\Hr\Models\HrFinancePayment::where('institution_id', $this->institutionId());
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('id', 'desc')->get()]);
    }

    public function update(Request $request, $id, \App\Modules\Hr\Services\HrNotificationService $notifications)
    {
        $payment = \App\Modules\Hr\Models\HrFinancePayment::where('institution_id', $this->institutionId())->findOrFail($id);
        $payload = $request->validate([
            'status' => 'required|string|max:30',
            'amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $payment->status = $payload['status'];
        if (isset($payload['amount'])) {
            $payment->amount = $payload['amount'];
        }
        if (in_array($payload['status'], ['paid','partially_paid'])) {
            $payment->paid_at = now();
            $payment->paid_by = auth()->id();
        }
        if (isset($payload['notes'])) {
            $payment->notes = $payload['notes'];
        }
        $payment->save();

        if ($payment->payroll_item_id) {
            $item = \App\Modules\Hr\Models\HrPayrollItem::find($payment->payroll_item_id);
            if ($item) {
                $item->payment_status = $payment->status;
                $item->save();

                if ($payment->status === 'paid') {
                    $staff = \App\Modules\Hr\Models\HrStaffProfile::find($item->staff_profile_id);
                    if ($staff) {
                        $notifications->sendToStaff($staff, 'Your salary payment has been processed.');
                    }
                }
            }
        }

        return response()->json(['success' => true, 'data' => $payment->fresh()]);
    }

}
