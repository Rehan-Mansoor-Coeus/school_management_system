<?php

namespace App\Http\Controllers\Api\Timesheets;

use App\CourseContactHourPlan;
use App\CourseContactHourTeacher;
use App\Http\Controllers\Api\Timesheets\Concerns\ResolvesTimesheetContext;
use App\Http\Controllers\Controller;
use App\Services\Timesheets\ScheduleConflictChecker;
use App\Services\Timesheets\TimetableSuggestionService;
use App\Services\Timesheets\TimesheetNotificationService;
use App\ShiftType;
use App\StaffTimesheetEntry;
use App\StaffWorkSchedule;
use App\TeacherAvailability;
use App\TeacherSchedule;
use App\TeachingTimesheetEntry;
use App\TimesheetAcademicYear;
use App\TimesheetApproval;
use App\TimesheetClass;
use App\TimesheetCourse;
use App\TimesheetNotification;
use App\TimesheetPeriod;
use App\TimetableSuggestion;
use App\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TimesheetExtendedController extends Controller
{
    use ResolvesTimesheetContext;

    protected $scheduler;
    protected $conflicts;
    protected $notifications;

    public function __construct(
        TimetableSuggestionService $scheduler,
        ScheduleConflictChecker $conflicts,
        TimesheetNotificationService $notifications
    ) {
        $this->scheduler = $scheduler;
        $this->conflicts = $conflicts;
        $this->notifications = $notifications;
    }

    public function dashboard(Request $request)
    {
        $institutionId = $this->institutionId($request);
        $user = $request->user();
        $today = Carbon::today();
        $dayOfWeek = $today->dayOfWeekIso;

        $todayTeaching = TeacherSchedule::with(['course', 'classModel'])
            ->where('institution_id', $institutionId)
            ->where('teacher_id', $user->id)
            ->where('day_of_week', $dayOfWeek)
            ->where('status', 'active')
            ->orderBy('start_time')
            ->get();

        $weekTeaching = TeacherSchedule::with(['course', 'classModel'])
            ->where('institution_id', $institutionId)
            ->where('teacher_id', $user->id)
            ->where('status', 'active')
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        $pendingTeaching = TeachingTimesheetEntry::where('institution_id', $institutionId)
            ->where('teacher_id', $user->id)
            ->whereIn('status', ['draft', 'correction_requested'])
            ->count();

        $pendingStaff = StaffTimesheetEntry::where('institution_id', $institutionId)
            ->where('staff_id', $user->id)
            ->whereIn('status', ['draft', 'correction_requested'])
            ->count();

        $pendingApprovals = 0;
        if ($user->can('timesheets.review') || $user->can('timesheets.approve_timesheets')) {
            $pendingApprovals = TeachingTimesheetEntry::where('institution_id', $institutionId)
                ->where('status', 'submitted')
                ->count()
                + StaffTimesheetEntry::where('institution_id', $institutionId)
                ->where('status', 'submitted')
                ->count();
        }

        $approvedTeachingHours = (float) TeachingTimesheetEntry::where('institution_id', $institutionId)
            ->where('teacher_id', $user->id)
            ->where('status', 'approved')
            ->sum('actual_contact_hours');

        $expectedTeachingHours = (float) TeacherSchedule::where('institution_id', $institutionId)
            ->where('teacher_id', $user->id)
            ->where('status', 'active')
            ->sum('expected_contact_hours');

        return response()->json([
            'today_schedules' => $todayTeaching,
            'weekly_schedules' => $weekTeaching,
            'pending_submissions' => $pendingTeaching + $pendingStaff,
            'pending_approvals' => $pendingApprovals,
            'expected_hours' => round($expectedTeachingHours, 2),
            'completed_hours' => round($approvedTeachingHours, 2),
            'overtime_hours' => round(max($approvedTeachingHours - $expectedTeachingHours, 0), 2),
            'under_time_hours' => round(max($expectedTeachingHours - $approvedTeachingHours, 0), 2),
        ]);
    }

    public function shiftTypes(Request $request)
    {
        return response()->json(
            ShiftType::where('institution_id', $this->institutionId($request))->orderBy('name')->get()
        );
    }

    public function storeShiftType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_duration_minutes' => 'required|integer|min:15|max:480',
            'is_teaching_shift' => 'nullable|boolean',
            'is_staff_shift' => 'nullable|boolean',
            'campus_id' => 'nullable|integer',
            'department_id' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => $this->trans($request, 'timesheets.validation_failed')], 422);
        }

        $institutionId = $this->institutionId($request);
        $shift = ShiftType::create([
            'institution_id' => $institutionId,
            'name' => $request->name,
            'description' => $request->description,
            'default_duration_minutes' => $request->default_duration_minutes,
            'is_teaching_shift' => $request->get('is_teaching_shift', false),
            'is_staff_shift' => $request->get('is_staff_shift', false),
            'campus_id' => $request->campus_id,
            'department_id' => $request->department_id,
            'status' => 'active',
        ]);

        $this->audit($institutionId, 'shift_type_created', optional($request->user())->id, 'shift_type', $shift->id);

        return response()->json(['message' => $this->trans($request, 'timesheets.saved'), 'shift_type' => $shift], 201);
    }

    public function updateShiftType(Request $request, ShiftType $shiftType)
    {
        if ((int) $shiftType->institution_id !== $this->institutionId($request)) {
            return response()->json(['message' => $this->trans($request, 'timesheets.institution_mismatch')], 404);
        }

        $shiftType->update($request->only([
            'name', 'description', 'default_duration_minutes', 'is_teaching_shift',
            'is_staff_shift', 'campus_id', 'department_id', 'status',
        ]));

        $this->audit($this->institutionId($request), 'shift_type_updated', optional($request->user())->id, 'shift_type', $shiftType->id);

        return response()->json(['message' => $this->trans($request, 'timesheets.saved'), 'shift_type' => $shiftType]);
    }

    public function references(Request $request)
    {
        $institutionId = $this->institutionId($request);
        return response()->json([
            'academic_years' => TimesheetAcademicYear::where('institution_id', $institutionId)->orderByDesc('name')->get(),
            'periods' => TimesheetPeriod::where('institution_id', $institutionId)->orderBy('name')->get(),
            'courses' => TimesheetCourse::where('institution_id', $institutionId)->orderBy('name')->get(),
            'classes' => TimesheetClass::where('institution_id', $institutionId)->orderBy('name')->get(),
            'teachers' => User::where('institution_id', $institutionId)->orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    public function storeReference(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:academic_year,period,course,class',
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:60',
            'level' => 'nullable|string|max:60',
            'period_type' => 'nullable|in:semester,term,trimester',
            'academic_year_id' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institutionId = $this->institutionId($request);
        $type = $request->type;

        if ($type === 'academic_year') {
            $record = TimesheetAcademicYear::create(['institution_id' => $institutionId, 'name' => $request->name, 'is_active' => true]);
        } elseif ($type === 'period') {
            $record = TimesheetPeriod::create([
                'institution_id' => $institutionId,
                'academic_year_id' => $request->academic_year_id,
                'period_type' => $request->period_type ?: 'semester',
                'name' => $request->name,
                'is_active' => true,
            ]);
        } elseif ($type === 'course') {
            $record = TimesheetCourse::create([
                'institution_id' => $institutionId,
                'name' => $request->name,
                'code' => $request->code,
                'is_active' => true,
            ]);
        } else {
            $record = TimesheetClass::create([
                'institution_id' => $institutionId,
                'name' => $request->name,
                'level' => $request->level,
                'is_active' => true,
            ]);
        }

        return response()->json(['message' => $this->trans($request, 'timesheets.saved'), 'record' => $record], 201);
    }

    public function teacherAvailabilities(Request $request)
    {
        $query = TeacherAvailability::where('institution_id', $this->institutionId($request));
        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }
        return response()->json($query->orderBy('teacher_id')->orderBy('day_of_week')->get());
    }

    public function storeTeacherAvailability(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'teacher_id' => 'required|exists:users,id',
            'day_of_week' => 'required|integer|min:1|max:7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!$this->userInInstitution($request, $request->teacher_id)) {
            return response()->json(['message' => $this->trans($request, 'timesheets.institution_mismatch')], 422);
        }

        $start = Carbon::parse($request->start_time);
        $end = Carbon::parse($request->end_time);
        $institutionId = $this->institutionId($request);

        $record = TeacherAvailability::create([
            'institution_id' => $institutionId,
            'teacher_id' => $request->teacher_id,
            'day_of_week' => $request->day_of_week,
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'expected_minutes' => $start->diffInMinutes($end),
            'status' => 'active',
        ]);

        $this->audit($institutionId, 'teacher_availability_created', optional($request->user())->id, 'teacher_availability', $record->id);

        return response()->json(['message' => $this->trans($request, 'timesheets.saved'), 'availability' => $record], 201);
    }

    public function availableTeachers(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'day_of_week' => 'required|integer|min:1|max:7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institutionId = $this->institutionId($request);
        $availabilities = TeacherAvailability::where('institution_id', $institutionId)
            ->where('day_of_week', $request->day_of_week)
            ->where('status', 'active')
            ->get()
            ->filter(function ($item) use ($request) {
                return $this->conflicts->withinAvailability(collect([$item]), $item->day_of_week, $request->start_time, $request->end_time);
            })
            ->filter(function ($item) use ($request, $institutionId) {
                return !$this->conflicts->teacherConflict(
                    $institutionId,
                    $item->teacher_id,
                    $request->day_of_week,
                    $request->start_time,
                    $request->end_time
                );
            })
            ->values();

        return response()->json($availabilities);
    }

    public function staffWorkSchedules(Request $request)
    {
        $query = StaffWorkSchedule::with('shiftType')->where('institution_id', $this->institutionId($request));
        if ($request->filled('staff_id')) {
            $query->where('staff_id', $request->staff_id);
        }
        return response()->json($query->orderBy('staff_id')->orderBy('day_of_week')->get());
    }

    public function storeStaffWorkSchedule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:users,id',
            'shift_type_id' => 'nullable|exists:shift_types,id',
            'day_of_week' => 'required|integer|min:1|max:7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!$this->userInInstitution($request, $request->staff_id)) {
            return response()->json(['message' => $this->trans($request, 'timesheets.institution_mismatch')], 422);
        }

        $start = Carbon::parse($request->start_time);
        $end = Carbon::parse($request->end_time);
        $institutionId = $this->institutionId($request);

        $record = StaffWorkSchedule::create([
            'institution_id' => $institutionId,
            'staff_id' => $request->staff_id,
            'shift_type_id' => $request->shift_type_id,
            'day_of_week' => $request->day_of_week,
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'expected_minutes' => $start->diffInMinutes($end),
            'status' => 'active',
        ]);

        $this->audit($institutionId, 'staff_schedule_created', optional($request->user())->id, 'staff_work_schedule', $record->id);

        return response()->json(['message' => $this->trans($request, 'timesheets.saved'), 'schedule' => $record], 201);
    }

    public function coursePlans(Request $request)
    {
        $plans = CourseContactHourPlan::with(['course', 'classModel', 'teachers.teacher'])
            ->where('institution_id', $this->institutionId($request))
            ->orderByDesc('id')
            ->get();

        return response()->json($plans);
    }

    public function storeCoursePlan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'academic_year_id' => 'required|exists:timesheet_academic_years,id',
            'period_id' => 'nullable|exists:timesheet_periods,id',
            'course_id' => 'required|exists:timesheet_courses,id',
            'class_id' => 'nullable|exists:timesheet_classes,id',
            'required_contact_hours' => 'required|numeric|min:1',
            'preferred_shift_duration_minutes' => 'nullable|integer|min:15|max:480',
            'teacher_ids' => 'nullable|array',
            'teacher_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institutionId = $this->institutionId($request);
        $required = (float) $request->required_contact_hours;

        $plan = CourseContactHourPlan::create([
            'institution_id' => $institutionId,
            'academic_year_id' => $request->academic_year_id,
            'period_id' => $request->period_id,
            'course_id' => $request->course_id,
            'class_id' => $request->class_id,
            'required_contact_hours' => $required,
            'remaining_contact_hours' => $required,
            'preferred_shift_duration_minutes' => $request->get('preferred_shift_duration_minutes', 45),
            'status' => 'active',
        ]);

        foreach ($request->get('teacher_ids', []) as $teacherId) {
            if ($this->userInInstitution($request, $teacherId)) {
                CourseContactHourTeacher::create([
                    'institution_id' => $institutionId,
                    'course_contact_hour_plan_id' => $plan->id,
                    'teacher_id' => $teacherId,
                    'status' => 'active',
                ]);
            }
        }

        $this->audit($institutionId, 'course_plan_created', optional($request->user())->id, 'course_contact_hour_plan', $plan->id);

        return response()->json(['message' => $this->trans($request, 'timesheets.saved'), 'plan' => $plan->load('teachers.teacher')], 201);
    }

    public function generateTimetableSuggestion(Request $request, CourseContactHourPlan $plan)
    {
        if ((int) $plan->institution_id !== $this->institutionId($request)) {
            return response()->json(['message' => $this->trans($request, 'timesheets.institution_mismatch')], 404);
        }

        $result = $this->scheduler->generate($plan);

        $suggestion = TimetableSuggestion::create([
            'institution_id' => $plan->institution_id,
            'course_contact_hour_plan_id' => $plan->id,
            'generated_by' => optional($request->user())->id,
            'suggestion_payload' => $result,
            'total_required_contact_hours' => $result['total_required_contact_hours'],
            'total_suggested_contact_hours' => $result['total_suggested_contact_hours'],
            'remaining_unscheduled_contact_hours' => $result['remaining_unscheduled_contact_hours'],
            'status' => 'draft',
        ]);

        $this->audit($plan->institution_id, 'timetable_suggestion_generated', optional($request->user())->id, 'timetable_suggestion', $suggestion->id);

        if (!empty($result['conflicts'])) {
            $courseName = optional($plan->course)->name ?: 'course';
            $this->notifications->notify(
                $request->user(),
                'timetable_conflict',
                ['course' => $courseName],
                ['plan_id' => $plan->id]
            );
        }

        return response()->json(['suggestion' => $suggestion, 'preview' => $result]);
    }

    public function acceptTimetableSuggestion(Request $request, TimetableSuggestion $suggestion)
    {
        if ((int) $suggestion->institution_id !== $this->institutionId($request)) {
            return response()->json(['message' => $this->trans($request, 'timesheets.institution_mismatch')], 404);
        }

        $validator = Validator::make($request->all(), [
            'shift_type_id' => 'required|exists:shift_types,id',
            'slots' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $plan = CourseContactHourPlan::findOrFail($suggestion->course_contact_hour_plan_id);
        $payload = $suggestion->suggestion_payload;
        $slots = $request->get('slots', $payload['slots'] ?? []);

        $created = $this->scheduler->persistAcceptedSlots(
            $plan,
            $slots,
            $request->shift_type_id,
            $plan->academic_year_id,
            $plan->period_id,
            $request->get('schedule_source', 'suggested')
        );

        $suggestion->status = $request->get('status', 'accepted');
        $suggestion->save();

        $this->audit($plan->institution_id, 'timetable_suggestion_accepted', optional($request->user())->id, 'timetable_suggestion', $suggestion->id);

        return response()->json([
            'message' => $this->trans($request, 'timesheets.saved'),
            'schedules' => $created,
            'plan' => $this->scheduler->recalculatePlanHours($plan),
        ]);
    }

    public function teacherSchedules(Request $request)
    {
        $query = TeacherSchedule::with(['teacher', 'course', 'classModel', 'shiftType'])
            ->where('institution_id', $this->institutionId($request));

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }
        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        return response()->json($query->orderBy('day_of_week')->orderBy('start_time')->get());
    }

    public function storeTeacherSchedule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'teacher_id' => 'required|exists:users,id',
            'course_id' => 'nullable|exists:timesheet_courses,id',
            'class_id' => 'nullable|exists:timesheet_classes,id',
            'shift_type_id' => 'required|exists:shift_types,id',
            'course_contact_hour_plan_id' => 'nullable|exists:course_contact_hour_plans,id',
            'day_of_week' => 'required|integer|min:1|max:7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!$this->userInInstitution($request, $request->teacher_id)) {
            return response()->json(['message' => $this->trans($request, 'timesheets.institution_mismatch')], 422);
        }

        $institutionId = $this->institutionId($request);
        if ($this->conflicts->teacherConflict($institutionId, $request->teacher_id, $request->day_of_week, $request->start_time, $request->end_time)) {
            return response()->json(['message' => $this->trans($request, 'timesheets.teacher_conflict')], 422);
        }
        if ($this->conflicts->classConflict($institutionId, $request->class_id, $request->day_of_week, $request->start_time, $request->end_time)) {
            return response()->json(['message' => $this->trans($request, 'timesheets.class_conflict')], 422);
        }

        $availabilities = TeacherAvailability::where('institution_id', $institutionId)
            ->where('teacher_id', $request->teacher_id)
            ->where('status', 'active')
            ->get();

        if ($availabilities->isNotEmpty() && !$this->conflicts->withinAvailability($availabilities, $request->day_of_week, $request->start_time, $request->end_time)) {
            return response()->json(['message' => $this->trans($request, 'timesheets.outside_availability')], 422);
        }

        $start = Carbon::parse($request->start_time);
        $end = Carbon::parse($request->end_time);
        $minutes = $start->diffInMinutes($end);

        $schedule = TeacherSchedule::create([
            'institution_id' => $institutionId,
            'teacher_id' => $request->teacher_id,
            'course_id' => $request->course_id,
            'class_id' => $request->class_id,
            'shift_type_id' => $request->shift_type_id,
            'course_contact_hour_plan_id' => $request->course_contact_hour_plan_id,
            'academic_year_id' => $request->academic_year_id,
            'period_id' => $request->period_id,
            'day_of_week' => $request->day_of_week,
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'expected_minutes' => $minutes,
            'expected_contact_hours' => round($minutes / 60, 2),
            'schedule_source' => 'manual',
            'status' => 'active',
        ]);

        if ($schedule->course_contact_hour_plan_id) {
            $this->scheduler->recalculatePlanHours(CourseContactHourPlan::find($schedule->course_contact_hour_plan_id));
        }

        $this->audit($institutionId, 'teacher_schedule_assigned', optional($request->user())->id, 'teacher_schedule', $schedule->id);

        return response()->json(['message' => $this->trans($request, 'timesheets.saved'), 'schedule' => $schedule], 201);
    }

    public function myTeachingSchedules(Request $request)
    {
        return $this->teacherSchedules($request->merge(['teacher_id' => optional($request->user())->id]));
    }

    public function teachingEntries(Request $request)
    {
        $query = TeachingTimesheetEntry::with('schedule.course')
            ->where('institution_id', $this->institutionId($request));

        if (!$request->user()->can('timesheets.review')) {
            $query->where('teacher_id', $request->user()->id);
        }

        return response()->json($query->orderByDesc('date')->paginate(20));
    }

    public function storeTeachingEntry(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'teacher_schedule_id' => 'required|exists:teacher_schedules,id',
            'date' => 'required|date',
            'actual_start_time' => 'required|date_format:H:i',
            'actual_end_time' => 'required|date_format:H:i|after:actual_start_time',
            'topic_taught' => 'required|string|max:255',
            'sub_topic' => 'nullable|string|max:255',
            'activity_description' => 'nullable|string',
            'remarks' => 'nullable|string',
            'submit' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $schedule = TeacherSchedule::findOrFail($request->teacher_schedule_id);
        $institutionId = $this->institutionId($request);

        if ((int) $schedule->institution_id !== $institutionId || (int) $schedule->teacher_id !== (int) $request->user()->id) {
            return response()->json(['message' => $this->trans($request, 'timesheets.not_authorized')], 403);
        }

        if (TeachingTimesheetEntry::where('teacher_schedule_id', $schedule->id)->where('date', $request->date)->exists()) {
            return response()->json(['message' => $this->trans($request, 'timesheets.duplicate_entry')], 422);
        }

        $actualStart = Carbon::parse($request->actual_start_time);
        $actualEnd = Carbon::parse($request->actual_end_time);
        $actualMinutes = $actualStart->diffInMinutes($actualEnd);

        $entry = TeachingTimesheetEntry::create([
            'institution_id' => $institutionId,
            'teacher_id' => $request->user()->id,
            'teacher_schedule_id' => $schedule->id,
            'course_contact_hour_plan_id' => $schedule->course_contact_hour_plan_id,
            'course_id' => $schedule->course_id,
            'class_id' => $schedule->class_id,
            'date' => $request->date,
            'scheduled_start_time' => $schedule->start_time,
            'scheduled_end_time' => $schedule->end_time,
            'actual_start_time' => $actualStart->format('H:i:s'),
            'actual_end_time' => $actualEnd->format('H:i:s'),
            'actual_minutes' => $actualMinutes,
            'actual_contact_hours' => round($actualMinutes / 60, 2),
            'topic_taught' => $request->topic_taught,
            'sub_topic' => $request->sub_topic,
            'activity_description' => $request->activity_description,
            'remarks' => $request->remarks,
            'status' => $request->get('submit') ? 'submitted' : 'draft',
        ]);

        $this->audit($institutionId, $request->get('submit') ? 'teaching_timesheet_submitted' : 'teaching_timesheet_created', $request->user()->id, 'teaching_timesheet_entry', $entry->id);

        return response()->json(['message' => $this->trans($request, 'timesheets.saved'), 'entry' => $entry], 201);
    }

    public function staffEntries(Request $request)
    {
        $query = StaffTimesheetEntry::with('activity')
            ->where('institution_id', $this->institutionId($request));

        if (!$request->user()->can('timesheets.review')) {
            $query->where('staff_id', $request->user()->id);
        }

        return response()->json($query->orderByDesc('date')->paginate(20));
    }

    public function storeStaffEntry(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'activity_id' => 'nullable|exists:timesheet_activities,id',
            'staff_work_schedule_id' => 'nullable|exists:staff_work_schedules,id',
            'actual_start_time' => 'required|date_format:H:i',
            'actual_end_time' => 'required|date_format:H:i|after:actual_start_time',
            'description' => 'nullable|string',
            'remarks' => 'nullable|string',
            'submit' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $actualStart = Carbon::parse($request->actual_start_time);
        $actualEnd = Carbon::parse($request->actual_end_time);
        $actualMinutes = $actualStart->diffInMinutes($actualEnd);
        $institutionId = $this->institutionId($request);

        $entry = StaffTimesheetEntry::create([
            'institution_id' => $institutionId,
            'staff_id' => $request->user()->id,
            'staff_work_schedule_id' => $request->staff_work_schedule_id,
            'activity_id' => $request->activity_id,
            'date' => $request->date,
            'actual_start_time' => $actualStart->format('H:i:s'),
            'actual_end_time' => $actualEnd->format('H:i:s'),
            'actual_minutes' => $actualMinutes,
            'description' => $request->description,
            'remarks' => $request->remarks,
            'status' => $request->get('submit') ? 'submitted' : 'draft',
        ]);

        $this->audit($institutionId, $request->get('submit') ? 'staff_timesheet_submitted' : 'staff_timesheet_created', $request->user()->id, 'staff_timesheet_entry', $entry->id);

        return response()->json(['message' => $this->trans($request, 'timesheets.saved'), 'entry' => $entry], 201);
    }

    public function entryApprovals(Request $request)
    {
        $institutionId = $this->institutionId($request);

        return response()->json([
            'teaching' => TeachingTimesheetEntry::with(['schedule.course'])
                ->where('institution_id', $institutionId)
                ->where('status', 'submitted')
                ->orderByDesc('date')
                ->get(),
            'staff' => StaffTimesheetEntry::with('activity')
                ->where('institution_id', $institutionId)
                ->where('status', 'submitted')
                ->orderByDesc('date')
                ->get(),
        ]);
    }

    public function reviewEntry(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'timesheet_type' => 'required|in:teaching,staff',
            'entry_id' => 'required|integer',
            'action' => 'required|in:approve,reject,request_correction',
            'comment' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->action !== 'approve' && !$request->filled('comment')) {
            return response()->json(['message' => $this->trans($request, 'timesheets.validation_failed')], 422);
        }

        $institutionId = $this->institutionId($request);
        $entry = $request->timesheet_type === 'teaching'
            ? TeachingTimesheetEntry::findOrFail($request->entry_id)
            : StaffTimesheetEntry::findOrFail($request->entry_id);

        if ((int) $entry->institution_id !== $institutionId || $entry->status !== 'submitted') {
            return response()->json(['message' => $this->trans($request, 'timesheets.validation_failed')], 422);
        }

        $statusMap = [
            'approve' => 'approved',
            'reject' => 'rejected',
            'request_correction' => 'correction_requested',
        ];

        DB::transaction(function () use ($request, $entry, $statusMap, $institutionId) {
            $entry->status = $statusMap[$request->action];
            $entry->save();

            TimesheetApproval::create([
                'institution_id' => $institutionId,
                'timesheet_id' => null,
                'timesheet_entry_id' => $entry->id,
                'timesheet_type' => $request->timesheet_type,
                'acted_by' => optional($request->user())->id,
                'approved_by' => optional($request->user())->id,
                'action' => $request->action,
                'status' => $statusMap[$request->action],
                'comment' => $request->comment,
                'acted_at' => Carbon::now(),
                'approved_at' => Carbon::now(),
            ]);
        });

        if ($request->timesheet_type === 'teaching' && $request->action === 'approve' && $entry->course_contact_hour_plan_id) {
            $plan = CourseContactHourPlan::find($entry->course_contact_hour_plan_id);
            if ($plan) {
                $this->scheduler->recalculatePlanHours($plan);
                $teacherLink = CourseContactHourTeacher::where('course_contact_hour_plan_id', $plan->id)
                    ->where('teacher_id', $entry->teacher_id)
                    ->first();
                if ($teacherLink) {
                    $teacherLink->completed_contact_hours = round(
                        (float) $teacherLink->completed_contact_hours + (float) $entry->actual_contact_hours,
                        2
                    );
                    $teacherLink->save();
                }
                if ($plan->remaining_contact_hours <= 0) {
                    $this->notifications->notify($request->user(), 'course_hours_completed', ['course' => optional($plan->course)->name ?: 'course']);
                } elseif ($plan->remaining_contact_hours > ($plan->required_contact_hours * 0.25)) {
                    $this->notifications->notify($request->user(), 'course_hours_behind', [
                        'course' => optional($plan->course)->name ?: 'course',
                        'remaining' => $plan->remaining_contact_hours,
                    ]);
                }
            }
        }

        $owner = User::find($request->timesheet_type === 'teaching' ? $entry->teacher_id : $entry->staff_id);
        if ($owner) {
            $event = $request->action === 'approve' ? 'timesheet_approved' : ($request->action === 'reject' ? 'timesheet_rejected' : 'correction_requested');
            $this->notifications->notify($owner, $event, [
                'name' => $owner->name,
                'reason' => $request->comment ?: '-',
            ]);
        }

        $this->audit($institutionId, 'timesheet_' . $request->action, optional($request->user())->id, $request->timesheet_type . '_timesheet_entry', $entry->id);

        return response()->json(['message' => $this->trans($request, 'timesheets.saved'), 'entry' => $entry]);
    }

    public function extendedReports(Request $request)
    {
        $institutionId = $this->institutionId($request);
        $type = $request->get('type', 'course_contact_hours');

        if ($type === 'course_contact_hours') {
            $rows = CourseContactHourPlan::with(['course', 'classModel', 'teachers.teacher'])
                ->where('institution_id', $institutionId)
                ->get()
                ->map(function ($plan) {
                    $required = (float) $plan->required_contact_hours;
                    $completed = (float) $plan->completed_contact_hours;
                    return [
                        'course' => optional($plan->course)->name,
                        'class' => optional($plan->classModel)->name,
                        'required_contact_hours' => $required,
                        'scheduled_contact_hours' => (float) $plan->scheduled_contact_hours,
                        'completed_contact_hours' => $completed,
                        'remaining_contact_hours' => (float) $plan->remaining_contact_hours,
                        'completion_percent' => $required > 0 ? round(($completed / $required) * 100, 2) : 0,
                        'teachers' => $plan->teachers->map(function ($t) {
                            return ['name' => optional($t->teacher)->name, 'completed' => (float) $t->completed_contact_hours];
                        }),
                    ];
                });
            return response()->json(['rows' => $rows]);
        }

        if ($type === 'topics_taught') {
            $rows = TeachingTimesheetEntry::with('schedule.course')
                ->where('institution_id', $institutionId)
                ->where('status', 'approved')
                ->orderByDesc('date')
                ->get(['date', 'topic_taught', 'sub_topic', 'actual_contact_hours', 'teacher_id', 'course_id']);
            return response()->json(['rows' => $rows]);
        }

        if ($type === 'hourly_payment') {
            $users = User::where('institution_id', $institutionId)->get(['id', 'name', 'email', 'hourly_rate', 'department_id']);
            $rows = $users->map(function ($user) use ($institutionId) {
                $approvedTeaching = (float) TeachingTimesheetEntry::where('institution_id', $institutionId)
                    ->where('teacher_id', $user->id)->where('status', 'approved')->sum('actual_contact_hours');
                $approvedStaffMinutes = (int) StaffTimesheetEntry::where('institution_id', $institutionId)
                    ->where('staff_id', $user->id)->where('status', 'approved')->sum('actual_minutes');
                $approvedStaff = round($approvedStaffMinutes / 60, 2);
                $totalApproved = round($approvedTeaching + $approvedStaff, 2);
                $rate = (float) ($user->hourly_rate ?: 0);
                return [
                    'name' => $user->name,
                    'email' => $user->email,
                    'department_id' => $user->department_id,
                    'approved_teaching_hours' => $approvedTeaching,
                    'approved_staff_hours' => $approvedStaff,
                    'total_approved_hours' => $totalApproved,
                    'hourly_rate' => $rate,
                    'total_payable' => round($totalApproved * $rate, 2),
                ];
            });
            return response()->json(['rows' => $rows]);
        }

        return response()->json(['rows' => []]);
    }

    public function notifications(Request $request)
    {
        return response()->json(
            TimesheetNotification::where('institution_id', $this->institutionId($request))
                ->where('user_id', $request->user()->id)
                ->orderByDesc('id')
                ->paginate(20)
        );
    }

    public function markNotificationRead(Request $request, TimesheetNotification $notification)
    {
        if ((int) $notification->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => $this->trans($request, 'timesheets.not_authorized')], 403);
        }
        $notification->read_at = Carbon::now();
        $notification->save();
        return response()->json(['message' => $this->trans($request, 'timesheets.saved')]);
    }
}
