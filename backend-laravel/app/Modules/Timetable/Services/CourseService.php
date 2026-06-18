<?php

namespace App\Modules\Timetable\Services;

use App\Modules\Timetable\Models\Course;

class CourseService
{
    public function list(int $institutionId, array $filters = [])
    {
        $query = Course::query()
            ->with(['department:id,name', 'programme:id,name,code', 'programmeSemester:id,name,semester_number', 'subject:id,name,code'])
            ->where('institution_id', $institutionId);

        if (! empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }
        if (! empty($filters['programme_id'])) {
            $query->where('programme_id', $filters['programme_id']);
        }
        if (! empty($filters['programme_semester_id'])) {
            $query->where('programme_semester_id', $filters['programme_semester_id']);
        }
        if (isset($filters['active']) && $filters['active'] !== '') {
            $query->where('is_active', (bool) $filters['active']);
        }
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('code')->get();
    }

    public function create(int $institutionId, ?int $userId, array $data): Course
    {
        $data['institution_id'] = $institutionId;
        $data['created_by'] = $userId;

        return Course::create($data);
    }

    public function update(Course $course, array $data): Course
    {
        $course->update($data);

        return $course->fresh();
    }

    public function delete(Course $course): void
    {
        $course->delete();
    }
}
