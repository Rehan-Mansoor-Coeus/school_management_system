<?php

namespace App\Modules\Hostel\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hostel\Concerns\ResolvesInstitution;
use App\Modules\Hostel\Models\HostelClearance;
use Illuminate\Http\Request;

class ClearanceController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:hostel');
    }

    public function index(Request $request)
    {
        $query = HostelClearance::where('institution_id', $this->institutionId())
            ->with(['allocation.student.user', 'allocation.room.hostel', 'clearedByUser']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(['success' => true, 'data' => $query->latest()->paginate(20)]);
    }

    public function update(Request $request, $id)
    {
        $clearance = HostelClearance::where('institution_id', $this->institutionId())->findOrFail($id);

        $data = $request->validate([
            'room_inspected' => 'boolean',
            'items_returned' => 'boolean',
            'fees_cleared' => 'boolean',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:pending,cleared,rejected',
        ]);

        $clearance->update($data);

        $allCleared = $clearance->room_inspected && $clearance->items_returned && $clearance->fees_cleared;
        if ($allCleared && ($data['status'] ?? '') !== 'rejected') {
            $clearance->update([
                'status' => 'cleared',
                'cleared_by' => auth()->id(),
                'cleared_at' => now(),
            ]);
        } elseif (($data['status'] ?? '') === 'rejected') {
            $clearance->update(['status' => 'rejected']);
        }

        return response()->json(['success' => true, 'data' => $clearance->fresh(['allocation.student.user', 'allocation.room.hostel'])]);
    }
}
