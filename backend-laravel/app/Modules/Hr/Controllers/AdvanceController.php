<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class AdvanceController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except([]);
        $this->middleware('module_enabled:hr');
    }


    public function index(Request $request)
    {
        $query = \App\Modules\Hr\Models\HrAdvancePayment::where('institution_id', $this->institutionId());
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('id', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'staff_profile_id' => 'required|integer',
            'job_id' => 'nullable|integer',
            'amount' => 'required|numeric|min:0',
            'paid_date' => 'required|date',
            'reason' => 'nullable|string',
        ]);

        $staff = \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $this->institutionId())->findOrFail($payload['staff_profile_id']);

        $data = \App\Modules\Hr\Models\HrAdvancePayment::create([
            'institution_id' => $this->institutionId(),
            'staff_profile_id' => $staff->id,
            'job_id' => isset($payload['job_id']) ? $payload['job_id'] : null,
            'amount' => $payload['amount'],
            'paid_date' => $payload['paid_date'],
            'reason' => isset($payload['reason']) ? $payload['reason'] : null,
            'approved_by' => auth()->id(),
            'balance_remaining' => $payload['amount'],
            'status' => 'open',
        ]);

        return response()->json(['success' => true, 'data' => $data], 201);
    }

}
