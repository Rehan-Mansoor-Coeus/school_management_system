<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class TimesheetController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except([]);
        $this->middleware('module_enabled:hr');
    }


    public function index(Request $request)
    {
        $query = \App\Modules\Hr\Models\HrTimesheetEntry::where('institution_id', $this->institutionId());
        if ($request->filled('staff_profile_id')) {
            $query->where('staff_profile_id', $request->get('staff_profile_id'));
        }
        if ($request->filled('job_id')) {
            $query->where('job_id', $request->get('job_id'));
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('entry_date', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'staff_profile_id' => 'required|integer',
            'job_id' => 'nullable|integer',
            'entry_date' => 'required|date',
            'hours_worked' => 'nullable|numeric|min:0',
            'day_fraction' => 'nullable|numeric|min:0|max:1',
            'status' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);

        \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $this->institutionId())->findOrFail($payload['staff_profile_id']);

        $data = \App\Modules\Hr\Models\HrTimesheetEntry::updateOrCreate(
            [
                'institution_id' => $this->institutionId(),
                'staff_profile_id' => $payload['staff_profile_id'],
                'job_id' => isset($payload['job_id']) ? $payload['job_id'] : null,
                'entry_date' => $payload['entry_date'],
            ],
            [
                'hours_worked' => isset($payload['hours_worked']) ? $payload['hours_worked'] : 0,
                'day_fraction' => isset($payload['day_fraction']) ? $payload['day_fraction'] : 1,
                'status' => isset($payload['status']) ? $payload['status'] : 'confirmed',
                'notes' => isset($payload['notes']) ? $payload['notes'] : null,
                'confirmed_by' => auth()->id(),
            ]
        );

        return response()->json(['success' => true, 'data' => $data]);
    }

}
