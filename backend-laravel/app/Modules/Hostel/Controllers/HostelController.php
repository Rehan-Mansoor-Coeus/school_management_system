<?php

namespace App\Modules\Hostel\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hostel\Concerns\ResolvesInstitution;
use App\Modules\Hostel\Models\Hostel;
use Illuminate\Http\Request;

class HostelController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:hostel');
    }

    public function index(Request $request)
    {
        $query = Hostel::where('institution_id', $this->institutionId())
            ->withCount('rooms');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:hostels,code',
            'description' => 'nullable|string',
            'gender' => 'required|in:male,female,mixed',
            'location' => 'nullable|string|max:255',
            'caretaker_phone' => 'nullable|string|max:50',
            'caretaker_email' => 'nullable|email|max:255',
            'room_fee' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $hostel = Hostel::create(array_merge($data, [
            'institution_id' => $this->institutionId(),
            'total_rooms' => 0,
            'total_capacity' => 0,
            'occupied_capacity' => 0,
            'room_fee' => $data['room_fee'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]));

        return response()->json(['success' => true, 'data' => $hostel], 201);
    }

    public function update(Request $request, $id)
    {
        $hostel = Hostel::where('institution_id', $this->institutionId())->findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:50|unique:hostels,code,' . $hostel->id,
            'description' => 'nullable|string',
            'gender' => 'sometimes|in:male,female,mixed',
            'location' => 'nullable|string|max:255',
            'caretaker_phone' => 'nullable|string|max:50',
            'caretaker_email' => 'nullable|email|max:255',
            'room_fee' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $hostel->update($data);

        return response()->json(['success' => true, 'data' => $hostel->fresh()]);
    }

    public function destroy($id)
    {
        $hostel = Hostel::where('institution_id', $this->institutionId())->findOrFail($id);
        $hostel->delete();

        return response()->json(['success' => true, 'message' => __('hostel.deleted')]);
    }
}
