<?php

namespace App\Services\Timesheets;

use App\TeacherSchedule;
use Carbon\Carbon;

class ScheduleConflictChecker
{
    public function teacherConflict($institutionId, $teacherId, $dayOfWeek, $startTime, $endTime, $excludeScheduleId = null)
    {
        $start = $this->toMinutes($startTime);
        $end = $this->toMinutes($endTime);

        $query = TeacherSchedule::query()
            ->where('institution_id', $institutionId)
            ->where('teacher_id', $teacherId)
            ->where('day_of_week', $dayOfWeek)
            ->where('status', 'active');

        if ($excludeScheduleId) {
            $query->where('id', '!=', $excludeScheduleId);
        }

        foreach ($query->get() as $schedule) {
            if ($this->overlaps($start, $end, $this->toMinutes($schedule->start_time), $this->toMinutes($schedule->end_time))) {
                return true;
            }
        }

        return false;
    }

    public function classConflict($institutionId, $classId, $dayOfWeek, $startTime, $endTime, $excludeScheduleId = null)
    {
        if (!$classId) {
            return false;
        }

        $start = $this->toMinutes($startTime);
        $end = $this->toMinutes($endTime);

        $query = TeacherSchedule::query()
            ->where('institution_id', $institutionId)
            ->where('class_id', $classId)
            ->where('day_of_week', $dayOfWeek)
            ->where('status', 'active');

        if ($excludeScheduleId) {
            $query->where('id', '!=', $excludeScheduleId);
        }

        foreach ($query->get() as $schedule) {
            if ($this->overlaps($start, $end, $this->toMinutes($schedule->start_time), $this->toMinutes($schedule->end_time))) {
                return true;
            }
        }

        return false;
    }

    public function withinAvailability($availabilities, $dayOfWeek, $startTime, $endTime)
    {
        $start = $this->toMinutes($startTime);
        $end = $this->toMinutes($endTime);

        foreach ($availabilities as $availability) {
            if ((int) $availability->day_of_week !== (int) $dayOfWeek) {
                continue;
            }
            $aStart = $this->toMinutes($availability->start_time);
            $aEnd = $this->toMinutes($availability->end_time);
            if ($start >= $aStart && $end <= $aEnd) {
                return true;
            }
        }

        return false;
    }

    protected function overlaps($startA, $endA, $startB, $endB)
    {
        return $startA < $endB && $endA > $startB;
    }

    protected function toMinutes($time)
    {
        $carbon = Carbon::parse($time);
        return ($carbon->hour * 60) + $carbon->minute;
    }
}
