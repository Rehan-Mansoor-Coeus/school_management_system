<?php

namespace App\Modules\Timetable\Services;

use App\Modules\Timetable\Models\CourseAssignment;

class CourseAssignmentService
{
    public function list(int $institutionId, array $filters = [])
    {
        $query = CourseAssignment::query()
            ->with([
                'course:id,code,name,contact_hours',
                'teacher:id,name,email',
                'classroom:id,name,room_type',
                'programme:id,name,code',
                'programmeSemester:id,name,semester_number',
            ])
            ->where('institution_id', $institutionId);

        if (! empty($filters['course_id'])) {
            $query->where('course_id', $filters['course_id']);
        }
        if (! empty($filters['teacher_id'])) {
            $query->where('teacher_id', $filters['teacher_id']);
        }
        if (! empty($filters['programme_id'])) {
            $query->where('programme_id', $filters['programme_id']);
        }
        if (! empty($filters['programme_semester_id'])) {
            $query->where('programme_semester_id', $filters['programme_semester_id']);
        }

        return $query->orderByDesc('id')->get();
    }

    public function create(int $institutionId, ?int $userId, array $data): CourseAssignment
    {
        $data['institution_id'] = $institutionId;
        $data['created_by'] = $userId;

        return CourseAssignment::create($data);
    }

    public function update(CourseAssignment $assignment, array $data): CourseAssignment
    {
        $assignment->update($data);

        return $assignment->fresh();
    }

    public function delete(CourseAssignment $assignment): void
    {
        $assignment->delete();
    }
}
