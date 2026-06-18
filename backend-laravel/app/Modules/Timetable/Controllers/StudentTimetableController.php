<?php

namespace App\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Services\StudentTimetableService;
use Illuminate\Http\Request;

class StudentTimetableController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(StudentTimetableService $service)
    {
        $this->service = $service;
    }

    public function mine(Request $request)
    {
        $data = $this->service->forUser($this->institutionId(), (int) auth()->id(), $request->only(['programme_semester_id', 'academic_year']));

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function show(Request $request, $studentId)
    {
        $data = $this->service->forStudentId($this->institutionId(), (int) $studentId, $request->only(['programme_semester_id', 'academic_year']));

        return response()->json(['success' => true, 'data' => $data]);
    }
}
