<?php

namespace App\Modules\Timetable\Controllers;

use App\Department;
use App\Http\Controllers\Controller;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Models\Classroom;
use App\Modules\Timetable\Models\Course;
use App\Programme;
use App\ProgrammeSemester;
use App\User;

class OptionsController extends Controller
{
    use ResolvesInstitution;

    public function index()
    {
        $institutionId = $this->institutionId();

        $teachers = User::query()
            ->where('institution_id', $institutionId)
            ->where(function ($q) {
                $q->whereHas('roles', fn ($r) => $r->where('name', 'teacher'));
            })
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'department_id']);

        // Fallback: if no users carry the teacher role, expose active users so allocation still works.
        if ($teachers->isEmpty()) {
            $teachers = User::where('institution_id', $institutionId)->orderBy('name')->get(['id', 'name', 'email', 'department_id']);
        }

        $departments = Department::where('institution_id', $institutionId)->orderBy('name')->get(['id', 'name', 'code']);
        $programmes = Programme::where('institution_id', $institutionId)->orderBy('name')->get(['id', 'name', 'code', 'department_id']);
        $programmeSemesters = ProgrammeSemester::query()
            ->whereIn('programme_id', $programmes->pluck('id'))
            ->orderBy('programme_id')->orderBy('semester_number')
            ->get(['id', 'programme_id', 'name', 'semester_number', 'academic_year']);
        $classrooms = Classroom::where('institution_id', $institutionId)->where('is_active', true)->orderBy('name')->get(['id', 'name', 'room_type', 'capacity']);
        $courses = Course::where('institution_id', $institutionId)->where('is_active', true)->orderBy('code')->get(['id', 'code', 'name', 'department_id', 'programme_id', 'programme_semester_id', 'contact_hours']);

        return response()->json([
            'success' => true,
            'data' => [
                'teachers' => $teachers,
                'departments' => $departments,
                'programmes' => $programmes,
                'programme_semesters' => $programmeSemesters,
                'classrooms' => $classrooms,
                'courses' => $courses,
                'room_types' => Classroom::ROOM_TYPES,
            ],
        ]);
    }
}
