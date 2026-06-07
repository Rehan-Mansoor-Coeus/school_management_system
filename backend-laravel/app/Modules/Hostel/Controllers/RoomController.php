<?php

namespace App\Modules\Hostel\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hostel\Concerns\ResolvesInstitution;
use App\Modules\Hostel\Models\Hostel;
use App\Modules\Hostel\Models\HostelRoom;
use App\Modules\Hostel\Services\HostelAllocationService;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    use ResolvesInstitution;

    protected $allocationService;

    public function __construct(HostelAllocationService $allocationService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:hostel');
        $this->allocationService = $allocationService;
    }

    public function index(Request $request)
    {
        $query = HostelRoom::where('institution_id', $this->institutionId())
            ->with(['hostel', 'beds']);

        if ($request->filled('hostel_id')) {
            $query->where('hostel_id', $request->hostel_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('room_number')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'hostel_id' => 'required|exists:hostels,id',
            'room_number' => 'required|string|max:50',
            'room_type' => 'required|in:single,double,triple,quad',
            'capacity' => 'required|integer|min:1|max:8',
            'monthly_fee' => 'required|numeric|min:0',
            'facilities' => 'nullable|string',
            'floor_number' => 'nullable|string|max:20',
            'status' => 'nullable|in:available,full,maintenance,closed',
        ]);

        Hostel::where('institution_id', $this->institutionId())->findOrFail($data['hostel_id']);

        $exists = HostelRoom::where('hostel_id', $data['hostel_id'])
            ->where('room_number', $data['room_number'])
            ->exists();
        if ($exists) {
            return response()->json(['success' => false, 'message' => __('hostel.room_exists')], 422);
        }

        $room = HostelRoom::create(array_merge($data, [
            'institution_id' => $this->institutionId(),
            'occupied_beds' => 0,
            'status' => $data['status'] ?? 'available',
        ]));

        $this->allocationService->ensureBedsForRoom($room);
        $this->allocationService->syncHostelOccupancy($room->hostel_id);

        return response()->json(['success' => true, 'data' => $room->load(['hostel', 'beds'])], 201);
    }

    public function update(Request $request, $id)
    {
        $room = HostelRoom::where('institution_id', $this->institutionId())->findOrFail($id);

        $data = $request->validate([
            'room_number' => 'sometimes|string|max:50',
            'room_type' => 'sometimes|in:single,double,triple,quad',
            'capacity' => 'sometimes|integer|min:1|max:8',
            'monthly_fee' => 'sometimes|numeric|min:0',
            'facilities' => 'nullable|string',
            'floor_number' => 'nullable|string|max:20',
            'status' => 'nullable|in:available,full,maintenance,closed',
        ]);

        if (isset($data['room_number'])) {
            $exists = HostelRoom::where('hostel_id', $room->hostel_id)
                ->where('room_number', $data['room_number'])
                ->where('id', '!=', $room->id)
                ->exists();
            if ($exists) {
                return response()->json(['success' => false, 'message' => __('hostel.room_exists')], 422);
            }
        }

        $room->update($data);

        if (isset($data['capacity'])) {
            $this->allocationService->ensureBedsForRoom($room);
            $this->allocationService->syncRoomOccupancy($room);
            $this->allocationService->syncHostelOccupancy($room->hostel_id);
        }

        return response()->json(['success' => true, 'data' => $room->fresh(['hostel', 'beds'])]);
    }

    public function destroy($id)
    {
        $room = HostelRoom::where('institution_id', $this->institutionId())->findOrFail($id);
        $hostelId = $room->hostel_id;
        $room->delete();
        $this->allocationService->syncHostelOccupancy($hostelId);

        return response()->json(['success' => true, 'message' => __('hostel.deleted')]);
    }
}
