<?php

namespace App\Modules\Timetable\Services;

use App\Modules\Timetable\Models\TeacherAvailability;

class TeacherAvailabilityService
{
    public function listForTeacher(int $institutionId, int $teacherId)
    {
        return TeacherAvailability::query()
            ->where('institution_id', $institutionId)
            ->where('teacher_id', $teacherId)
            ->orderBy('day_of_week')
            ->get();
    }

    /**
     * Replace a teacher's weekly availability with the provided set of days.
     *
     * @param array $days Each item: ['day_of_week' => int, 'is_available' => bool, 'start_time' => ?string, 'end_time' => ?string]
     */
    public function sync(int $institutionId, int $teacherId, array $days): array
    {
        foreach ($days as $day) {
            $dow = (int) ($day['day_of_week'] ?? 0);
            if ($dow < 1 || $dow > 7) {
                continue;
            }

            TeacherAvailability::updateOrCreate(
                ['teacher_id' => $teacherId, 'day_of_week' => $dow],
                [
                    'institution_id' => $institutionId,
                    'is_available' => (bool) ($day['is_available'] ?? true),
                    'start_time' => $day['start_time'] ?? null,
                    'end_time' => $day['end_time'] ?? null,
                ]
            );
        }

        return $this->listForTeacher($institutionId, $teacherId)->toArray();
    }
}
