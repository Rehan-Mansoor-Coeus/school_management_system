<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class JobController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except([]);
        $this->middleware('module_enabled:hr');
    }


    public function index(Request $request)
    {
        $query = \App\Modules\Hr\Models\HrJob::where('institution_id', $this->institutionId());
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('id', 'desc')->get()]);
    }

    public function show($id)
    {
        $job = \App\Modules\Hr\Models\HrJob::where('institution_id', $this->institutionId())->findOrFail($id);
        $staff = \App\Modules\Hr\Models\HrJobStaff::where('job_id', $job->id)->get();

        return response()->json(['success' => true, 'data' => ['job' => $job, 'staff' => $staff]]);
    }

    public function store(Request $request)
    {
        $payload = $request->validate([
            'name' => 'required|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'status' => 'nullable|string|max:20',
        ]);
        $payload['institution_id'] = $this->institutionId();
        $payload['created_by'] = auth()->id();
        $payload['status'] = $payload['status'] ?? 'draft';
        $item = \App\Modules\Hr\Models\HrJob::create($payload);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function update(Request $request, $id)
    {
        $item = \App\Modules\Hr\Models\HrJob::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->update($request->only(['name','client_name','location','description','start_date','end_date','status']));

        return response()->json(['success' => true, 'data' => $item->fresh()]);
    }

    public function assignStaff(Request $request, $id)
    {
        $job = \App\Modules\Hr\Models\HrJob::where('institution_id', $this->institutionId())->findOrFail($id);
        $payload = $request->validate([
            'staff_profile_id' => 'required|integer',
            'daily_rate' => 'nullable|numeric|min:0',
            'days_worked' => 'nullable|numeric|min:0',
            'day_status' => 'nullable|in:full,partial',
            'partial_fraction' => 'nullable|numeric|min:0|max:1',
            'notes' => 'nullable|string',
        ]);

        $staff = \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $this->institutionId())->findOrFail($payload['staff_profile_id']);
        $row = \App\Modules\Hr\Models\HrJobStaff::updateOrCreate(
            ['job_id' => $job->id, 'staff_profile_id' => $staff->id],
            [
                'daily_rate' => $payload['daily_rate'] ?? $staff->daily_rate ?? 0,
                'days_worked' => $payload['days_worked'] ?? 0,
                'day_status' => $payload['day_status'] ?? 'full',
                'partial_fraction' => $payload['partial_fraction'] ?? 1,
                'notes' => $payload['notes'] ?? null,
            ]
        );

        return response()->json(['success' => true, 'data' => $row]);
    }

    public function updateStaff(Request $request, $jobId, $rowId)
    {
        $job = \App\Modules\Hr\Models\HrJob::where('institution_id', $this->institutionId())->findOrFail($jobId);
        $row = \App\Modules\Hr\Models\HrJobStaff::where('job_id', $job->id)->findOrFail($rowId);
        $row->update($request->only(['daily_rate','days_worked','day_status','partial_fraction','notes']));

        return response()->json(['success' => true, 'data' => $row->fresh()]);
    }

    public function removeStaff($jobId, $rowId)
    {
        $job = \App\Modules\Hr\Models\HrJob::where('institution_id', $this->institutionId())->findOrFail($jobId);
        $row = \App\Modules\Hr\Models\HrJobStaff::where('job_id', $job->id)->findOrFail($rowId);
        $row->delete();

        return response()->json(['success' => true, 'data' => true]);
    }

    public function syncTimesheet($id)
    {
        $job = \App\Modules\Hr\Models\HrJob::where('institution_id', $this->institutionId())->findOrFail($id);
        $rows = \App\Modules\Hr\Models\HrJobStaff::where('job_id', $job->id)->get();
        $updated = 0;

        foreach ($rows as $row) {
            $days = \App\Modules\Hr\Models\HrTimesheetEntry::where('institution_id', $this->institutionId())
                ->where('staff_profile_id', $row->staff_profile_id)
                ->where('job_id', $job->id)
                ->whereBetween('entry_date', [$job->start_date, $job->end_date])
                ->sum('day_fraction');
            if ($days > 0) {
                $row->days_worked = $days;
                $row->save();
                $updated++;
            }
        }

        return response()->json(['success' => true, 'data' => ['updated' => $updated]]);
    }

}
