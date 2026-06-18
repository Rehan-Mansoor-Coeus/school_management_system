<?php

namespace App\Modules\Timetable\Services;

use App\Modules\Timetable\Models\TimetableEntry;
use App\Student;

class StudentTimetableService
{
    /**
     * Resolve the timetable for a given user (student) automatically from their programme/level.
     */
    public function forUser(int $institutionId, int $userId, array $filters = []): array
    {
        $student = Student::where('user_id', $userId)->first();

        if (! $student) {
            return ['student' => null, 'entries' => [], 'message' => 'No student record is linked to this account.'];
        }

        return $this->forStudent($institutionId, $student, $filters);
    }

    public function forStudentId(int $institutionId, int $studentId, array $filters = []): array
    {
        $student = Student::find($studentId);
        if (! $student) {
            return ['student' => null, 'entries' => [], 'message' => 'Student not found.'];
        }

        return $this->forStudent($institutionId, $student, $filters);
    }

    protected function forStudent(int $institutionId, Student $student, array $filters): array
    {
        $query = TimetableEntry::query()
            ->with([
                'course:id,code,name',
                'teacher:id,name',
                'classroom:id,name,room_type',
                'programmeSemester:id,name,semester_number',
            ])
            ->where('institution_id', $institutionId)
            ->where('programme_id', $student->programme_id);

        // Students only see published/approved timetables.
        $query->whereIn('status', ['approved', 'published']);

        if (! empty($filters['programme_semester_id'])) {
            $query->where('programme_semester_id', $filters['programme_semester_id']);
        }
        if (! empty($filters['academic_year'])) {
            $query->where('academic_year', $filters['academic_year']);
        }

        $entries = $query->orderBy('day_of_week')->orderBy('start_time')->get();

        return [
            'student' => [
                'id' => $student->id,
                'registration_number' => $student->registration_number,
                'programme_id' => $student->programme_id,
                'current_level' => $student->current_level,
            ],
            'entries' => $entries,
        ];
    }
}
