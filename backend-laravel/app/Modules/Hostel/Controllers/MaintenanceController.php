<?php

namespace App\Modules\Hostel\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hostel\Concerns\ResolvesInstitution;
use App\Modules\Hostel\Models\Hostel;
use App\Modules\Hostel\Models\HostelMaintenanceRequest;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:hostel');
    }

    public function index(Request $request)
    {
        $query = HostelMaintenanceRequest::where('institution_id', $this->institutionId())
            ->with(['hostel', 'room', 'bed', 'reporter', 'assignee']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('hostel_id')) {
            $query->where('hostel_id', $request->hostel_id);
        }

        return response()->json(['success' => true, 'data' => $query->latest()->paginate(20)]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'hostel_id' => 'required|exists:hostels,id',
            'room_id' => 'nullable|exists:rooms,id',
            'bed_id' => 'nullable|exists:hostel_beds,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'nullable|in:low,medium,high,urgent',
        ]);

        Hostel::where('institution_id', $this->institutionId())->findOrFail($data['hostel_id']);

        $requestRecord = HostelMaintenanceRequest::create(array_merge($data, [
            'institution_id' => $this->institutionId(),
            'priority' => $data['priority'] ?? 'medium',
            'status' => 'open',
            'reported_by' => auth()->id(),
        ]));

        return response()->json(['success' => true, 'data' => $requestRecord->load(['hostel', 'room', 'bed'])], 201);
    }

    public function update(Request $request, $id)
    {
        $record = HostelMaintenanceRequest::where('institution_id', $this->institutionId())->findOrFail($id);

        $data = $request->validate([
            'status' => 'nullable|in:open,in_progress,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
        ]);

        if (($data['status'] ?? '') === 'completed') {
            $data['completed_at'] = now();
        }

        $record->update($data);

        return response()->json(['success' => true, 'data' => $record->fresh(['hostel', 'room', 'bed', 'reporter', 'assignee'])]);
    }
}
