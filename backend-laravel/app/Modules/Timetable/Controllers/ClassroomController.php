<?php

namespace App\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Models\Classroom;
use App\Modules\Timetable\Services\ClassroomService;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(ClassroomService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $items = $this->service->list($this->institutionId(), $request->only(['room_type', 'active']));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);
        $room = $this->service->create($this->institutionId(), (int) auth()->id(), $data);

        return response()->json(['success' => true, 'data' => $room], 201);
    }

    public function update(Request $request, $id)
    {
        $room = Classroom::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $this->validatePayload($request, false);
        $updated = $this->service->update($room, $data);

        return response()->json(['success' => true, 'data' => $updated]);
    }

    public function destroy($id)
    {
        $room = Classroom::where('institution_id', $this->institutionId())->findOrFail($id);
        $this->service->delete($room);

        return response()->json(['success' => true, 'data' => ['deleted' => true]]);
    }

    protected function validatePayload(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'name' => ($creating ? 'required' : 'sometimes').'|string|max:255',
            'building' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:0',
            'room_type' => 'nullable|in:'.implode(',', Classroom::ROOM_TYPES),
            'is_active' => 'nullable|boolean',
        ]);
    }
}
