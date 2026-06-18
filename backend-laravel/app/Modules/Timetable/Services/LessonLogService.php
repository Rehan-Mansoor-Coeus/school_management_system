<?php

namespace App\Modules\Timetable\Services;

use App\Modules\Timetable\Models\CourseAssignment;
use App\Modules\Timetable\Models\LessonLog;
use Illuminate\Support\Carbon;

class LessonLogService
{
    public function list(int $institutionId, array $filters = [])
    {
        $query = LessonLog::query()
            ->with(['course:id,code,name', 'teacher:id,name'])
            ->where('institution_id', $institutionId);

        foreach (['course_id', 'teacher_id', 'assignment_id', 'programme_semester_id'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }
        if (! empty($filters['from'])) {
            $query->whereDate('lesson_date', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $query->whereDate('lesson_date', '<=', $filters['to']);
        }

        return $query->orderByDesc('lesson_date')->orderByDesc('id')->get();
    }

    public function create(int $institutionId, ?int $userId, array $data): LessonLog
    {
        $data['institution_id'] = $institutionId;
        $data['created_by'] = $userId;
        $data['duration_hours'] = $this->resolveDuration($data);

        $log = LessonLog::create($data);

        $this->recalculateAssignment($data['assignment_id'] ?? null);

        return $log->fresh();
    }

    public function delete(LessonLog $log): void
    {
        $assignmentId = $log->assignment_id;
        $log->delete();
        $this->recalculateAssignment($assignmentId);
    }

    protected function resolveDuration(array $data): float
    {
        if (! empty($data['duration_hours'])) {
            return (float) $data['duration_hours'];
        }

        if (! empty($data['start_time']) && ! empty($data['end_time'])) {
            $start = Carbon::parse($data['start_time']);
            $end = Carbon::parse($data['end_time']);
            $minutes = $end->diffInMinutes($start);

            return round($minutes / 60, 2);
        }

        return 0.0;
    }

    /**
     * Recompute the cached completed contact hours for an assignment from its lesson logs.
     */
    public function recalculateAssignment(?int $assignmentId): void
    {
        if (! $assignmentId) {
            return;
        }

        $assignment = CourseAssignment::find($assignmentId);
        if (! $assignment) {
            return;
        }

        $total = LessonLog::where('assignment_id', $assignmentId)->sum('duration_hours');
        $assignment->update(['completed_contact_hours' => $total]);
    }
}
