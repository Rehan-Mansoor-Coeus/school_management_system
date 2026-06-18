<?php

namespace App\Modules\Timetable\Services;

use App\Modules\Timetable\Models\Classroom;
use App\Modules\Timetable\Models\CourseAssignment;
use App\Modules\Timetable\Models\TimetableEntry;
use App\Modules\Timetable\Models\TimetableSetting;
use Illuminate\Support\Carbon;

class TimetableGeneratorService
{
    protected $availabilityService;

    public function __construct(TeacherAvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }

    /**
     * Auto-generate a timetable for a scope (department/programme/semester/year).
     * Respects teacher availability, teacher/classroom/cohort conflicts and the weekly load cap.
     *
     * @return array Summary with created entries and any unscheduled sessions.
     */
    public function generate(int $institutionId, ?int $userId, array $params): array
    {
        $settings = TimetableSetting::forInstitution($institutionId);
        $lessonMinutes = max(30, (int) $settings->default_lesson_minutes);
        $weeks = max(1, (int) $settings->weeks_per_semester);
        $maxWeeklyMinutes = max(0, (int) $settings->max_weekly_teaching_hours) * 60;
        $workingDays = $settings->workingDays();
        $dayStart = substr((string) $settings->day_start_time, 0, 5) ?: '08:00';
        $dayEnd = substr((string) $settings->day_end_time, 0, 5) ?: '17:00';
        $replace = ! array_key_exists('replace', $params) || (bool) $params['replace'];
        $academicYear = $params['academic_year'] ?? null;

        // Assignments in scope
        $assignments = CourseAssignment::query()
            ->with('course')
            ->where('institution_id', $institutionId)
            ->where('is_active', true)
            ->when(! empty($params['programme_id']), fn ($q) => $q->where('programme_id', $params['programme_id']))
            ->when(! empty($params['programme_semester_id']), fn ($q) => $q->where('programme_semester_id', $params['programme_semester_id']))
            ->when(! empty($params['academic_year']), fn ($q) => $q->where('academic_year', $params['academic_year']))
            ->get();

        if (! empty($params['department_id'])) {
            $assignments = $assignments->filter(fn ($a) => optional($a->course)->department_id == $params['department_id'])->values();
        }

        if ($assignments->isEmpty()) {
            return [
                'created' => 0,
                'entries' => [],
                'unscheduled' => [],
                'message' => 'No active course assignments found for the selected scope. Create course assignments first.',
            ];
        }

        // Remove existing entries in this exact scope so regeneration is clean.
        if ($replace) {
            TimetableEntry::query()
                ->where('institution_id', $institutionId)
                ->when(! empty($params['programme_id']), fn ($q) => $q->where('programme_id', $params['programme_id']))
                ->when(! empty($params['programme_semester_id']), fn ($q) => $q->where('programme_semester_id', $params['programme_semester_id']))
                ->when(! empty($params['department_id']), fn ($q) => $q->where('department_id', $params['department_id']))
                ->when(! empty($params['academic_year']), fn ($q) => $q->where('academic_year', $params['academic_year']))
                ->forceDelete();
        }

        // Build occupancy from all remaining entries (other scopes too) to avoid cross-clashes.
        $occupancy = $this->buildOccupancy($institutionId);
        $teacherWeekly = $this->teacherWeeklyMinutes($institutionId);

        $classrooms = Classroom::where('institution_id', $institutionId)->where('is_active', true)->get();
        $slots = $this->buildSlots($workingDays, $dayStart, $dayEnd, $lessonMinutes);

        $created = [];
        $unscheduled = [];

        foreach ($assignments as $assignment) {
            $course = $assignment->course;
            if (! $course) {
                continue;
            }

            $weeklyHours = $course->contact_hours > 0
                ? $course->contact_hours / $weeks
                : max(1, (float) $course->credit_hours);
            $sessions = max(1, min(12, (int) ceil(($weeklyHours * 60) / $lessonMinutes)));

            $teacherId = (int) $assignment->teacher_id;
            $cohortId = $assignment->programme_semester_id;
            $needsLab = ($course->laboratory_hours > 0 || $course->practical_hours > 0);

            $placedForAssignment = 0;
            foreach ($slots as $slot) {
                if ($placedForAssignment >= $sessions) {
                    break;
                }

                [$day, $start, $end] = [$slot['day'], $slot['start'], $slot['end']];

                // Teacher availability
                if (! $this->teacherAvailable($institutionId, $teacherId, $day, $start, $end)) {
                    continue;
                }

                // Weekly load cap
                if ($maxWeeklyMinutes > 0 && (($teacherWeekly[$teacherId] ?? 0) + $lessonMinutes) > $maxWeeklyMinutes) {
                    continue;
                }

                // Teacher / cohort conflict
                if ($this->busy($occupancy, 'teacher', $teacherId, $day, $start, $end)) {
                    continue;
                }
                if ($cohortId && $this->busy($occupancy, 'cohort', $cohortId, $day, $start, $end)) {
                    continue;
                }

                // Classroom selection
                $roomId = $this->pickClassroom($assignment, $classrooms, $occupancy, $day, $start, $end, $needsLab);
                if ($roomId === false) {
                    continue;
                }

                $entry = TimetableEntry::create([
                    'institution_id' => $institutionId,
                    'department_id' => $course->department_id,
                    'programme_id' => $assignment->programme_id ?: $course->programme_id,
                    'programme_semester_id' => $cohortId ?: $course->programme_semester_id,
                    'academic_year' => $academicYear ?: $assignment->academic_year,
                    'course_id' => $course->id,
                    'teacher_id' => $teacherId,
                    'classroom_id' => $roomId,
                    'assignment_id' => $assignment->id,
                    'day_of_week' => $day,
                    'start_time' => $start.':00',
                    'end_time' => $end.':00',
                    'source' => 'auto',
                    'status' => 'draft',
                    'created_by' => $userId,
                ]);

                // Record occupancy
                $this->markBusy($occupancy, 'teacher', $teacherId, $day, $start, $end);
                if ($roomId) {
                    $this->markBusy($occupancy, 'room', $roomId, $day, $start, $end);
                }
                if ($cohortId) {
                    $this->markBusy($occupancy, 'cohort', $cohortId, $day, $start, $end);
                }
                $teacherWeekly[$teacherId] = ($teacherWeekly[$teacherId] ?? 0) + $lessonMinutes;

                $created[] = $entry;
                $placedForAssignment++;
            }

            if ($placedForAssignment < $sessions) {
                $unscheduled[] = [
                    'assignment_id' => $assignment->id,
                    'course_code' => $course->code,
                    'course_name' => $course->name,
                    'requested_sessions' => $sessions,
                    'placed_sessions' => $placedForAssignment,
                    'reason' => 'Not enough free, conflict-free slots (teacher availability, room, or weekly load limit).',
                ];
            }
        }

        return [
            'created' => count($created),
            'entries' => array_map(fn ($e) => $e->id, $created),
            'unscheduled' => $unscheduled,
            'message' => count($created).' slot(s) generated.'.(count($unscheduled) ? ' Some sessions could not be placed.' : ''),
        ];
    }

    protected function buildSlots(array $days, string $dayStart, string $dayEnd, int $lessonMinutes): array
    {
        $slots = [];
        foreach ($days as $day) {
            $cursor = Carbon::createFromFormat('H:i', $dayStart);
            $limit = Carbon::createFromFormat('H:i', $dayEnd);
            while ($cursor->copy()->addMinutes($lessonMinutes)->lte($limit)) {
                $start = $cursor->format('H:i');
                $end = $cursor->copy()->addMinutes($lessonMinutes)->format('H:i');
                $slots[] = ['day' => (int) $day, 'start' => $start, 'end' => $end];
                $cursor->addMinutes($lessonMinutes);
            }
        }

        return $slots;
    }

    protected function buildOccupancy(int $institutionId): array
    {
        $occupancy = ['teacher' => [], 'room' => [], 'cohort' => []];
        $entries = TimetableEntry::where('institution_id', $institutionId)->get();
        foreach ($entries as $e) {
            $start = substr((string) $e->start_time, 0, 5);
            $end = substr((string) $e->end_time, 0, 5);
            if ($e->teacher_id) {
                $this->markBusy($occupancy, 'teacher', $e->teacher_id, $e->day_of_week, $start, $end);
            }
            if ($e->classroom_id) {
                $this->markBusy($occupancy, 'room', $e->classroom_id, $e->day_of_week, $start, $end);
            }
            if ($e->programme_semester_id) {
                $this->markBusy($occupancy, 'cohort', $e->programme_semester_id, $e->day_of_week, $start, $end);
            }
        }

        return $occupancy;
    }

    protected function teacherWeeklyMinutes(int $institutionId): array
    {
        $map = [];
        $entries = TimetableEntry::where('institution_id', $institutionId)->whereNotNull('teacher_id')->get(['teacher_id', 'start_time', 'end_time']);
        foreach ($entries as $e) {
            $minutes = Carbon::parse($e->end_time)->diffInMinutes(Carbon::parse($e->start_time));
            $map[$e->teacher_id] = ($map[$e->teacher_id] ?? 0) + $minutes;
        }

        return $map;
    }

    protected function markBusy(array &$occupancy, string $kind, $id, int $day, string $start, string $end): void
    {
        $occupancy[$kind][$id][$day][] = [$start, $end];
    }

    protected function busy(array $occupancy, string $kind, $id, int $day, string $start, string $end): bool
    {
        foreach ($occupancy[$kind][$id][$day] ?? [] as [$s, $e]) {
            if (TimetableService::timesOverlap($start, $end, $s, $e)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return int|false Classroom id, null if none assigned and none needed, or false if no free room.
     */
    protected function pickClassroom(CourseAssignment $assignment, $classrooms, array $occupancy, int $day, string $start, string $end, bool $needsLab)
    {
        // Preferred classroom on the assignment
        if ($assignment->classroom_id) {
            if (! $this->busy($occupancy, 'room', $assignment->classroom_id, $day, $start, $end)) {
                return (int) $assignment->classroom_id;
            }

            return false; // preferred room busy -> try another slot
        }

        if ($classrooms->isEmpty()) {
            return null; // no rooms configured; schedule without a room
        }

        $labTypes = ['laboratory', 'computer_lab', 'workshop'];
        $ordered = $needsLab
            ? $classrooms->sortByDesc(fn ($r) => in_array($r->room_type, $labTypes) ? 1 : 0)
            : $classrooms;

        foreach ($ordered as $room) {
            if (! $this->busy($occupancy, 'room', $room->id, $day, $start, $end)) {
                return (int) $room->id;
            }
        }

        return false;
    }

    protected function teacherAvailable(int $institutionId, int $teacherId, int $day, string $start, string $end): bool
    {
        static $cache = [];
        if (! isset($cache[$teacherId])) {
            $cache[$teacherId] = $this->availabilityService
                ->listForTeacher($institutionId, $teacherId)
                ->keyBy('day_of_week');
        }

        $record = $cache[$teacherId]->get($day);
        if (! $record) {
            return true; // no explicit availability set -> treat as available
        }
        if (! $record->is_available) {
            return false;
        }
        if ($record->start_time && $start < substr((string) $record->start_time, 0, 5)) {
            return false;
        }
        if ($record->end_time && $end > substr((string) $record->end_time, 0, 5)) {
            return false;
        }

        return true;
    }
}
