<?php

namespace App\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Models\CourseAssignment;
use App\Modules\Timetable\Services\CourseAssignmentService;
use Illuminate\Http\Request;

class CourseAssignmentController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(CourseAssignmentService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $items = $this->service->list($this->institutionId(), $request->only([
            'course_id', 'teacher_id', 'programme_id', 'programme_semester_id',
        ]));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);
        $assignment = $this->service->create($this->institutionId(), (int) auth()->id(), $data);

        return response()->json(['success' => true, 'data' => $assignment], 201);
    }

    public function update(Request $request, $id)
    {
        $assignment = CourseAssignment::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $this->validatePayload($request, false);
        $updated = $this->service->update($assignment, $data);

        return response()->json(['success' => true, 'data' => $updated]);
    }

    public function destroy($id)
    {
        $assignment = CourseAssignment::where('institution_id', $this->institutionId())->findOrFail($id);
        $this->service->delete($assignment);

        return response()->json(['success' => true, 'data' => ['deleted' => true]]);
    }

    protected function validatePayload(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'course_id' => ($creating ? 'required' : 'sometimes').'|integer',
            'teacher_id' => ($creating ? 'required' : 'sometimes').'|integer',
            'classroom_id' => 'nullable|integer',
            'programme_id' => 'nullable|integer',
            'programme_semester_id' => 'nullable|integer',
            'academic_year' => 'nullable|string|max:50',
            'expected_contact_hours' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);
    }
}
