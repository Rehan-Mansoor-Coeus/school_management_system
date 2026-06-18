<?php

namespace App\Modules\Timetable\Services;

use App\Modules\Timetable\Models\TimetableEntry;

class TimetableService
{
    public function list(int $institutionId, array $filters = [])
    {
        $query = TimetableEntry::query()
            ->with([
                'course:id,code,name',
                'teacher:id,name',
                'classroom:id,name,room_type',
                'department:id,name',
                'programme:id,name,code',
                'programmeSemester:id,name,semester_number',
            ])
            ->where('institution_id', $institutionId);

        foreach (['department_id', 'programme_id', 'programme_semester_id', 'teacher_id', 'classroom_id', 'course_id', 'day_of_week', 'status'] as $field) {
            if (isset($filters[$field]) && $filters[$field] !== '' && $filters[$field] !== null) {
                $query->where($field, $filters[$field]);
            }
        }
        if (! empty($filters['academic_year'])) {
            $query->where('academic_year', $filters['academic_year']);
        }

        return $query->orderBy('day_of_week')->orderBy('start_time')->get();
    }

    public function create(int $institutionId, ?int $userId, array $data): TimetableEntry
    {
        $data['institution_id'] = $institutionId;
        $data['created_by'] = $userId;

        return TimetableEntry::create($data);
    }

    public function update(TimetableEntry $entry, array $data): TimetableEntry
    {
        $entry->update($data);

        return $entry->fresh();
    }

    public function delete(TimetableEntry $entry): void
    {
        $entry->delete();
    }

    /**
     * Detect teacher, classroom and cohort (programme-semester) clashes for a slot.
     *
     * @return array List of conflict descriptions (empty = no clash).
     */
    public function detectConflicts(int $institutionId, array $slot, ?int $ignoreId = null): array
    {
        $conflicts = [];
        $day = (int) $slot['day_of_week'];
        $start = $slot['start_time'];
        $end = $slot['end_time'];

        $base = TimetableEntry::query()
            ->where('institution_id', $institutionId)
            ->where('day_of_week', $day)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            // overlap: existing.start < new.end AND existing.end > new.start
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start);

        if (! empty($slot['teacher_id'])) {
            $clash = (clone $base)->where('teacher_id', $slot['teacher_id'])->with('course:id,code')->first();
            if ($clash) {
                $conflicts[] = [
                    'type' => 'teacher',
                    'message' => 'Teacher already has a class at this time.',
                    'entry_id' => $clash->id,
                ];
            }
        }

        if (! empty($slot['classroom_id'])) {
            $clash = (clone $base)->where('classroom_id', $slot['classroom_id'])->first();
            if ($clash) {
                $conflicts[] = [
                    'type' => 'classroom',
                    'message' => 'Classroom is already booked at this time.',
                    'entry_id' => $clash->id,
                ];
            }
        }

        if (! empty($slot['programme_semester_id'])) {
            $clash = (clone $base)->where('programme_semester_id', $slot['programme_semester_id'])->first();
            if ($clash) {
                $conflicts[] = [
                    'type' => 'cohort',
                    'message' => 'This programme/semester group already has a class at this time.',
                    'entry_id' => $clash->id,
                ];
            }
        }

        return $conflicts;
    }

    public static function timesOverlap(string $start1, string $end1, string $start2, string $end2): bool
    {
        return $start1 < $end2 && $end1 > $start2;
    }
}
