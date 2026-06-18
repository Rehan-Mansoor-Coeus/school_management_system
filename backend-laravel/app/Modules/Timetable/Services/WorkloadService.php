<?php

namespace App\Modules\Timetable\Services;

use App\Modules\Timetable\Models\CourseAssignment;
use App\Modules\Timetable\Models\LessonLog;
use App\Modules\Timetable\Models\TimetableEntry;
use App\Modules\Timetable\Models\TimetableSetting;
use App\User;
use Illuminate\Support\Carbon;

class WorkloadService
{
    /**
     * Build a workload summary for each teacher that has assignments or scheduled slots.
     */
    public function summary(int $institutionId, array $filters = []): array
    {
        $settings = TimetableSetting::forInstitution($institutionId);
        $maxWeekly = (int) $settings->max_weekly_teaching_hours;

        $assignments = CourseAssignment::query()
            ->with(['course:id,code,name', 'teacher:id,name'])
            ->where('institution_id', $institutionId)
            ->when(! empty($filters['teacher_id']), fn ($q) => $q->where('teacher_id', $filters['teacher_id']))
            ->get();

        $entries = TimetableEntry::query()
            ->where('institution_id', $institutionId)
            ->whereNotNull('teacher_id')
            ->get(['teacher_id', 'start_time', 'end_time']);

        $weeklyByTeacher = [];
        foreach ($entries as $entry) {
            $minutes = Carbon::parse($entry->end_time)->diffInMinutes(Carbon::parse($entry->start_time));
            $weeklyByTeacher[$entry->teacher_id] = ($weeklyByTeacher[$entry->teacher_id] ?? 0) + $minutes;
        }

        $grouped = $assignments->groupBy('teacher_id');
        $result = [];

        foreach ($grouped as $teacherId => $items) {
            $teacher = $items->first()->teacher;
            $expected = (int) $items->sum('expected_contact_hours');
            $completed = (float) $items->sum('completed_contact_hours');
            $weeklyHours = round(($weeklyByTeacher[$teacherId] ?? 0) / 60, 2);

            $result[] = [
                'teacher_id' => (int) $teacherId,
                'teacher_name' => $teacher->name ?? ('Teacher #'.$teacherId),
                'courses' => $items->map(fn ($a) => [
                    'assignment_id' => $a->id,
                    'course_id' => $a->course_id,
                    'code' => $a->course->code ?? null,
                    'name' => $a->course->name ?? null,
                    'expected_contact_hours' => (int) $a->expected_contact_hours,
                    'completed_contact_hours' => (float) $a->completed_contact_hours,
                ])->values(),
                'course_count' => $items->count(),
                'expected_hours' => $expected,
                'completed_hours' => $completed,
                'remaining_hours' => max(0, round($expected - $completed, 2)),
                'weekly_hours' => $weeklyHours,
                'max_weekly_hours' => $maxWeekly,
                'over_limit' => $weeklyHours > $maxWeekly,
            ];
        }

        // Also include teachers that only have scheduled slots but no assignment rows.
        foreach ($weeklyByTeacher as $teacherId => $minutes) {
            if ($grouped->has($teacherId)) {
                continue;
            }
            if (! empty($filters['teacher_id']) && (int) $filters['teacher_id'] !== (int) $teacherId) {
                continue;
            }
            $teacher = User::find($teacherId);
            $weeklyHours = round($minutes / 60, 2);
            $result[] = [
                'teacher_id' => (int) $teacherId,
                'teacher_name' => $teacher->name ?? ('Teacher #'.$teacherId),
                'courses' => [],
                'course_count' => 0,
                'expected_hours' => 0,
                'completed_hours' => 0,
                'remaining_hours' => 0,
                'weekly_hours' => $weeklyHours,
                'max_weekly_hours' => $maxWeekly,
                'over_limit' => $weeklyHours > $maxWeekly,
            ];
        }

        usort($result, fn ($a, $b) => strcmp($a['teacher_name'], $b['teacher_name']));

        return $result;
    }

    /**
     * Current weekly scheduled hours for a teacher (for allocation guards).
     */
    public function weeklyHoursForTeacher(int $institutionId, int $teacherId, ?int $ignoreEntryId = null): float
    {
        $entries = TimetableEntry::query()
            ->where('institution_id', $institutionId)
            ->where('teacher_id', $teacherId)
            ->when($ignoreEntryId, fn ($q) => $q->where('id', '!=', $ignoreEntryId))
            ->get(['start_time', 'end_time']);

        $minutes = 0;
        foreach ($entries as $entry) {
            $minutes += Carbon::parse($entry->end_time)->diffInMinutes(Carbon::parse($entry->start_time));
        }

        return round($minutes / 60, 2);
    }
}
