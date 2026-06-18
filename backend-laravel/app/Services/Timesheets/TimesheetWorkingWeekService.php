<?php

namespace App\Services\Timesheets;

use App\TimesheetEntry;
use App\TimesheetWorkingWeek;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class TimesheetWorkingWeekService
{
    public function calculateExpectedMinutes($startTime, $endTime, $breakMinutes)
    {
        if (!$startTime || !$endTime) {
            return 0;
        }

        $start = Carbon::parse($startTime);
        $end = Carbon::parse($endTime);

        if ($end->lte($start)) {
            return 0;
        }

        $totalMinutes = $start->diffInMinutes($end);
        $breakMinutes = max(0, (int) $breakMinutes);

        return max(0, $totalMinutes - $breakMinutes);
    }

    public function expectedDailyHours($institutionId, $userId, $date)
    {
        $dayOfWeek = Carbon::parse($date)->dayOfWeekIso;
        $row = TimesheetWorkingWeek::query()
            ->where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_working_day', true)
            ->first();

        if (!$row) {
            return 0.0;
        }

        $minutes = $row->expected_minutes ?: $this->calculateExpectedMinutes(
            $row->start_time,
            $row->end_time,
            $row->break_minutes
        );

        return round($minutes / 60, 2);
    }

    public function expectedPeriodHours($institutionId, $userId, $from, $to)
    {
        $total = 0.0;
        $period = CarbonPeriod::create(Carbon::parse($from), Carbon::parse($to));

        foreach ($period as $date) {
            $total += $this->expectedDailyHours($institutionId, $userId, $date->toDateString());
        }

        return round($total, 2);
    }

    public function applyOvertimeFlags(TimesheetEntry $entry)
    {
        $institutionId = (int) $entry->institution_id;
        $userId = (int) $entry->user_id;
        $date = $entry->work_date instanceof Carbon
            ? $entry->work_date->toDateString()
            : Carbon::parse($entry->work_date)->toDateString();

        $expectedDaily = $this->expectedDailyHours($institutionId, $userId, $date);
        $existingHours = (float) TimesheetEntry::query()
            ->where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->whereDate('work_date', $date)
            ->where('id', '!=', $entry->id)
            ->where('status', '!=', 'rejected')
            ->sum('hours_worked');

        $entryHours = (float) $entry->hours_worked;
        $newTotal = $existingHours + $entryHours;

        if ($expectedDaily > 0 && $newTotal > $expectedDaily) {
            $entry->is_overtime = true;
            $entry->overtime_hours = round(max($newTotal - $expectedDaily, 0), 2);
        } else {
            $entry->is_overtime = false;
            $entry->overtime_hours = 0;
        }

        return $entry;
    }
}
