<?php

namespace App\Services\Timesheets;

use App\CourseContactHourPlan;
use App\TeacherAvailability;
use App\TeacherSchedule;
use Carbon\Carbon;

class TimetableSuggestionService
{
    protected $conflicts;

    public function __construct(ScheduleConflictChecker $conflicts)
    {
        $this->conflicts = $conflicts;
    }

    public function generate(CourseContactHourPlan $plan)
    {
        $plan->load(['teachers.teacher', 'course', 'classModel']);
        $shiftMinutes = (int) $plan->preferred_shift_duration_minutes ?: 45;
        $requiredHours = (float) $plan->required_contact_hours;
        $requiredMinutes = (int) round($requiredHours * 60);

        $teacherIds = $plan->teachers->pluck('teacher_id')->all();
        if (empty($teacherIds)) {
            return [
                'slots' => [],
                'conflicts' => [],
                'total_required_contact_hours' => $requiredHours,
                'total_suggested_contact_hours' => 0,
                'remaining_unscheduled_contact_hours' => $requiredHours,
            ];
        }

        $availabilities = TeacherAvailability::query()
            ->where('institution_id', $plan->institution_id)
            ->whereIn('teacher_id', $teacherIds)
            ->where('status', 'active')
            ->get()
            ->groupBy('teacher_id');

        $slots = [];
        $conflictNotes = [];
        $scheduledMinutes = 0;
        $teacherIndex = 0;

        while ($scheduledMinutes < $requiredMinutes && count($teacherIds) > 0) {
            $teacherId = $teacherIds[$teacherIndex % count($teacherIds)];
            $teacherIndex++;
            $teacherAvailability = $availabilities->get($teacherId, collect());

            if ($teacherAvailability->isEmpty()) {
                continue;
            }

            $placed = false;
            foreach ($teacherAvailability as $availability) {
                $cursor = Carbon::parse($availability->start_time);
                $end = Carbon::parse($availability->end_time);

                while ($cursor->copy()->addMinutes($shiftMinutes)->lte($end) && $scheduledMinutes < $requiredMinutes) {
                    $slotStart = $cursor->format('H:i:s');
                    $slotEnd = $cursor->copy()->addMinutes($shiftMinutes)->format('H:i:s');

                    if (!$this->conflicts->withinAvailability($teacherAvailability, $availability->day_of_week, $slotStart, $slotEnd)) {
                        $cursor->addMinutes($shiftMinutes);
                        continue;
                    }

                    if ($this->conflicts->teacherConflict($plan->institution_id, $teacherId, $availability->day_of_week, $slotStart, $slotEnd)) {
                        $conflictNotes[] = ['type' => 'teacher', 'teacher_id' => $teacherId, 'day' => $availability->day_of_week, 'start' => $slotStart, 'end' => $slotEnd];
                        $cursor->addMinutes($shiftMinutes);
                        continue;
                    }

                    if ($this->conflicts->classConflict($plan->institution_id, $plan->class_id, $availability->day_of_week, $slotStart, $slotEnd)) {
                        $conflictNotes[] = ['type' => 'class', 'class_id' => $plan->class_id, 'day' => $availability->day_of_week, 'start' => $slotStart, 'end' => $slotEnd];
                        $cursor->addMinutes($shiftMinutes);
                        continue;
                    }

                    $contactHours = round($shiftMinutes / 60, 2);
                    $slots[] = [
                        'teacher_id' => $teacherId,
                        'day_of_week' => (int) $availability->day_of_week,
                        'start_time' => $slotStart,
                        'end_time' => $slotEnd,
                        'expected_minutes' => $shiftMinutes,
                        'expected_contact_hours' => $contactHours,
                        'course_id' => $plan->course_id,
                        'class_id' => $plan->class_id,
                    ];

                    $scheduledMinutes += $shiftMinutes;
                    $placed = true;
                    break;
                }

                if ($placed) {
                    break;
                }
            }

            if (!$placed && $teacherIndex > count($teacherIds) * 20) {
                break;
            }
        }

        $suggestedHours = round($scheduledMinutes / 60, 2);
        $remaining = round(max($requiredHours - $suggestedHours, 0), 2);

        return [
            'slots' => $slots,
            'conflicts' => $conflictNotes,
            'total_required_contact_hours' => $requiredHours,
            'total_suggested_contact_hours' => $suggestedHours,
            'remaining_unscheduled_contact_hours' => $remaining,
        ];
    }

    public function persistAcceptedSlots(CourseContactHourPlan $plan, array $slots, $shiftTypeId, $academicYearId, $periodId, $source = 'suggested')
    {
        $created = [];
        foreach ($slots as $slot) {
            $schedule = TeacherSchedule::create([
                'institution_id' => $plan->institution_id,
                'campus_id' => $plan->campus_id,
                'department_id' => $plan->department_id,
                'academic_year_id' => $academicYearId,
                'period_id' => $periodId,
                'teacher_id' => $slot['teacher_id'],
                'course_id' => $slot['course_id'] ?? $plan->course_id,
                'class_id' => $slot['class_id'] ?? $plan->class_id,
                'shift_type_id' => $shiftTypeId,
                'course_contact_hour_plan_id' => $plan->id,
                'day_of_week' => $slot['day_of_week'],
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time'],
                'expected_minutes' => $slot['expected_minutes'],
                'expected_contact_hours' => $slot['expected_contact_hours'],
                'schedule_source' => $source,
                'status' => 'active',
            ]);
            $created[] = $schedule;
        }

        $this->recalculatePlanHours($plan);

        return $created;
    }

    public function recalculatePlanHours(CourseContactHourPlan $plan)
    {
        $scheduled = (float) TeacherSchedule::query()
            ->where('course_contact_hour_plan_id', $plan->id)
            ->where('status', 'active')
            ->sum('expected_contact_hours');

        $completed = (float) $plan->teachingEntries()
            ->where('status', 'approved')
            ->sum('actual_contact_hours');

        $plan->scheduled_contact_hours = round($scheduled, 2);
        $plan->completed_contact_hours = round($completed, 2);
        $plan->remaining_contact_hours = round(max((float) $plan->required_contact_hours - $completed, 0), 2);
        $plan->save();

        return $plan;
    }
}
