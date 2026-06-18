<?php

namespace App\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Services\TeacherAvailabilityService;
use Illuminate\Http\Request;

class TeacherAvailabilityController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(TeacherAvailabilityService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $teacherId = (int) $request->input('teacher_id', auth()->id());
        $items = $this->service->listForTeacher($this->institutionId(), $teacherId);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'teacher_id' => 'required|integer',
            'days' => 'required|array',
            'days.*.day_of_week' => 'required|integer|min:1|max:7',
            'days.*.is_available' => 'nullable|boolean',
            'days.*.start_time' => 'nullable',
            'days.*.end_time' => 'nullable',
        ]);

        $result = $this->service->sync($this->institutionId(), (int) $data['teacher_id'], $data['days']);

        return response()->json(['success' => true, 'data' => $result]);
    }
}
