<?php

namespace App\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Models\LessonLog;
use App\Modules\Timetable\Services\LessonLogService;
use Illuminate\Http\Request;

class LessonLogController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(LessonLogService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['course_id', 'teacher_id', 'assignment_id', 'programme_semester_id', 'from', 'to']);

        // Plain teachers see only their own logs; supervisors/admins see all.
        $elevatedRoles = ['super-admin', 'system-super-admin', 'admin', 'institution-admin', 'head-of-department', 'hod', 'course-master', 'dean', 'registrar'];
        if (! $request->user()->hasAnyRole($elevatedRoles)) {
            $filters['teacher_id'] = auth()->id();
        }

        $items = $this->service->list($this->institutionId(), $filters);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'course_id' => 'required|integer',
            'assignment_id' => 'nullable|integer',
            'timetable_entry_id' => 'nullable|integer',
            'teacher_id' => 'nullable|integer',
            'programme_semester_id' => 'nullable|integer',
            'lesson_date' => 'required|date',
            'start_time' => 'nullable',
            'end_time' => 'nullable',
            'duration_hours' => 'nullable|numeric|min:0',
            'topic' => 'required|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        // Default the teacher to the logged-in user.
        $data['teacher_id'] = $data['teacher_id'] ?? auth()->id();

        $log = $this->service->create($this->institutionId(), (int) auth()->id(), $data);

        return response()->json(['success' => true, 'data' => $log], 201);
    }

    public function destroy($id)
    {
        $log = LessonLog::where('institution_id', $this->institutionId())->findOrFail($id);
        $this->service->delete($log);

        return response()->json(['success' => true, 'data' => ['deleted' => true]]);
    }
}
