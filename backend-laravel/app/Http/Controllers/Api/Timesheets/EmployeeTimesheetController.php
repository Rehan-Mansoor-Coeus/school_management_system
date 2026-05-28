<?php

namespace App\Http\Controllers\Api\Timesheets;

use App\Http\Controllers\Controller;
use App\Services\Timesheets\TimesheetWorkingWeekService;
use App\TimesheetActivity;
use App\TimesheetCategory;
use App\TimesheetEntry;
use App\TimesheetWorkingWeek;
use App\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmployeeTimesheetController extends Controller
{
    protected $weekService;

    public function __construct(TimesheetWorkingWeekService $weekService)
    {
        $this->weekService = $weekService;
    }

    // --- Categories ---

    public function categories(Request $request)
    {
        $institutionId = $this->institutionId($request);

        return response()->json(
            TimesheetCategory::query()
                ->where('institution_id', $institutionId)
                ->where('status', 'active')
                ->orderBy('name')
                ->get()
        );
    }

    public function storeCategory(Request $request)
    {
        if (!$this->hasAnyPermission($request, ['manage_timesheet_categories', 'timesheets.manage'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'color_tag' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $category = TimesheetCategory::create([
            'institution_id' => $this->institutionId($request),
            'user_id' => optional($request->user())->id,
            'name' => $request->name,
            'description' => $request->description,
            'color_tag' => $request->color_tag ?: '#3b82f6',
            'status' => 'active',
        ]);

        return response()->json(['message' => 'Category created.', 'category' => $category], 201);
    }

    public function updateCategory(Request $request, TimesheetCategory $category)
    {
        if (!$this->canAccessInstitution($request, $category->institution_id)) {
            return response()->json(['message' => 'Category not found.'], 404);
        }
        if (!$this->hasAnyPermission($request, ['manage_timesheet_categories', 'timesheets.manage'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'color_tag' => 'nullable|string|max:20',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $category->fill($request->only(['name', 'description', 'color_tag', 'status']));
        $category->save();

        return response()->json(['message' => 'Category updated.', 'category' => $category]);
    }

    public function destroyCategory(Request $request, TimesheetCategory $category)
    {
        if (!$this->canAccessInstitution($request, $category->institution_id)) {
            return response()->json(['message' => 'Category not found.'], 404);
        }
        if (!$this->hasAnyPermission($request, ['manage_timesheet_categories', 'timesheets.manage'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $category->status = 'inactive';
        $category->save();

        return response()->json(['message' => 'Category removed.']);
    }

    // --- Activities ---

    public function activities(Request $request)
    {
        $institutionId = $this->institutionId($request);
        $user = $request->user();

        $query = TimesheetActivity::query()
            ->with('category:id,name,color_tag')
            ->where('institution_id', $institutionId)
            ->where(function ($q) {
                $q->where('status', 'active')->orWhereNull('status');
            })
            ->where(function ($q) {
                $q->where('is_active', true)->orWhereNull('is_active');
            });

        if (!$this->hasAnyPermission($request, ['view_all_timesheets', 'timesheets.manage'])) {
            $query->where('user_id', $user->id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function storeActivity(Request $request)
    {
        if (!$this->hasAnyPermission($request, ['create_timesheet_activity', 'timesheets.create_entry', 'timesheets.manage'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:timesheet_categories,id',
            'description' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $institutionId = $this->institutionId($request);
        $user = $request->user();

        if ($request->category_id) {
            $category = TimesheetCategory::where('institution_id', $institutionId)->find($request->category_id);
            if (!$category) {
                return response()->json(['message' => 'Category not found for your institution.'], 422);
            }
        }

        $activity = TimesheetActivity::create([
            'institution_id' => $institutionId,
            'user_id' => $user->id,
            'category_id' => $request->category_id,
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => true,
            'status' => 'active',
            'created_by' => $user->id,
        ]);

        return response()->json(['message' => 'Activity created.', 'activity' => $activity->load('category')], 201);
    }

    public function updateActivity(Request $request, TimesheetActivity $activity)
    {
        if (!$this->canAccessInstitution($request, $activity->institution_id)) {
            return response()->json(['message' => 'Activity not found.'], 404);
        }
        if (!$this->canModifyOwnResource($request, (int) $activity->user_id, ['timesheets.manage'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|exists:timesheet_categories,id',
            'description' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $activity->fill($request->only(['name', 'category_id', 'description']));
        $activity->save();

        return response()->json(['message' => 'Activity updated.', 'activity' => $activity->load('category')]);
    }

    public function destroyActivity(Request $request, TimesheetActivity $activity)
    {
        if (!$this->canAccessInstitution($request, $activity->institution_id)) {
            return response()->json(['message' => 'Activity not found.'], 404);
        }
        if (!$this->canModifyOwnResource($request, (int) $activity->user_id, ['timesheets.manage'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $activity->status = 'inactive';
        $activity->is_active = false;
        $activity->save();

        return response()->json(['message' => 'Activity removed.']);
    }

    // --- Working Week ---

    public function workingWeek(Request $request)
    {
        $institutionId = $this->institutionId($request);
        $userId = $this->resolveWorkingWeekUserId($request);

        $rows = TimesheetWorkingWeek::query()
            ->where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->orderBy('day_of_week')
            ->get();

        if ($rows->isEmpty()) {
            $rows = collect(range(1, 7))->map(function ($day) use ($institutionId, $userId) {
                return [
                    'day_of_week' => $day,
                    'is_working_day' => in_array($day, [1, 2, 3, 4, 5]),
                    'start_time' => '09:00:00',
                    'end_time' => '18:00:00',
                    'break_minutes' => 60,
                    'expected_minutes' => 480,
                ];
            });
        }

        $summary = $this->buildWorkingWeekSummary($rows);

        return response()->json([
            'days' => $rows,
            'summary' => $summary,
        ]);
    }

    public function storeWorkingWeek(Request $request)
    {
        if (!$this->hasAnyPermission($request, ['manage_own_working_week', 'timesheets.manage'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'days' => 'required|array|min:1|max:7',
            'days.*.day_of_week' => 'required|integer|min:1|max:7',
            'days.*.is_working_day' => 'required|boolean',
            'days.*.start_time' => 'nullable|date_format:H:i',
            'days.*.end_time' => 'nullable|date_format:H:i',
            'days.*.break_minutes' => 'nullable|integer|min:0|max:480',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $institutionId = $this->institutionId($request);
        $userId = $this->resolveWorkingWeekUserId($request);
        $saved = [];

        foreach ($request->days as $day) {
            $isWorking = (bool) $day['is_working_day'];
            $startTime = $isWorking ? ($day['start_time'] ?? '09:00') : null;
            $endTime = $isWorking ? ($day['end_time'] ?? '18:00') : null;
            $breakMinutes = (int) ($day['break_minutes'] ?? 0);

            if ($isWorking && $startTime && $endTime) {
                $start = Carbon::createFromFormat('H:i', substr($startTime, 0, 5));
                $end = Carbon::createFromFormat('H:i', substr($endTime, 0, 5));
                if ($end->lte($start)) {
                    return response()->json(['message' => 'End time must be after start time for day ' . $day['day_of_week'] . '.'], 422);
                }
                $totalMinutes = $start->diffInMinutes($end);
                if ($breakMinutes > $totalMinutes) {
                    return response()->json(['message' => 'Break cannot exceed working duration for day ' . $day['day_of_week'] . '.'], 422);
                }
            }

            $expectedMinutes = $isWorking
                ? $this->weekService->calculateExpectedMinutes($startTime, $endTime, $breakMinutes)
                : 0;

            $saved[] = TimesheetWorkingWeek::updateOrCreate(
                [
                    'institution_id' => $institutionId,
                    'user_id' => $userId,
                    'day_of_week' => $day['day_of_week'],
                ],
                [
                    'is_working_day' => $isWorking,
                    'start_time' => $isWorking ? $startTime . ':00' : null,
                    'end_time' => $isWorking ? $endTime . ':00' : null,
                    'break_minutes' => $breakMinutes,
                    'expected_minutes' => $expectedMinutes,
                ]
            );
        }

        return response()->json([
            'message' => 'Working week saved.',
            'days' => $saved,
            'summary' => $this->buildWorkingWeekSummary(collect($saved)),
        ]);
    }

    // --- Entries ---

    public function entries(Request $request)
    {
        $institutionId = $this->institutionId($request);
        $user = $request->user();

        $query = TimesheetEntry::query()
            ->with(['activity.category', 'user:id,name,email'])
            ->where('institution_id', $institutionId)
            ->whereNotNull('user_id');

        if ($this->hasAnyPermission($request, ['view_all_timesheets', 'timesheets.manage', 'timesheets.review'])) {
            if ($request->filled('user_id')) {
                $query->where('user_id', $request->user_id);
            }
        } else {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('from')) {
            $query->whereDate('work_date', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('work_date', '<=', $request->to);
        }
        if ($request->filled('month')) {
            $month = Carbon::parse($request->month . '-01');
            $query->whereBetween('work_date', [$month->startOfMonth()->toDateString(), $month->copy()->endOfMonth()->toDateString()]);
        }

        return response()->json($query->orderByDesc('work_date')->orderByDesc('id')->paginate(50));
    }

    public function storeEntry(Request $request)
    {
        if (!$this->hasAnyPermission($request, ['fill_timesheet', 'timesheets.create_entry', 'timesheets.manage'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'activity_id' => 'required|exists:timesheet_activities,id',
            'hours' => 'required|numeric|min:0.25|max:24',
            'notes' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $institutionId = $this->institutionId($request);
        $user = $request->user();

        $activity = TimesheetActivity::where('institution_id', $institutionId)
            ->where('user_id', $user->id)
            ->where('id', $request->activity_id)
            ->where(function ($q) {
                $q->where('status', 'active')->orWhereNull('status');
            })
            ->first();

        if (!$activity) {
            return response()->json(['message' => 'Create an activity first before filling your timesheet.'], 422);
        }

        $entry = new TimesheetEntry([
            'institution_id' => $institutionId,
            'user_id' => $user->id,
            'activity_id' => $activity->id,
            'work_date' => Carbon::parse($request->date)->toDateString(),
            'hours_worked' => $request->hours,
            'description' => $request->notes,
            'notes' => $request->notes,
            'status' => 'pending',
        ]);

        $this->weekService->applyOvertimeFlags($entry);
        $entry->save();

        return response()->json(['message' => 'Timesheet entry saved.', 'entry' => $entry->load('activity.category')], 201);
    }

    public function updateEntry(Request $request, TimesheetEntry $entry)
    {
        if (!$this->canAccessInstitution($request, $entry->institution_id)) {
            return response()->json(['message' => 'Entry not found.'], 404);
        }
        if (!$this->canModifyOwnResource($request, (int) $entry->user_id, ['timesheets.manage', 'edit_own_timesheet'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        if ($entry->status === 'approved') {
            return response()->json(['message' => 'Approved entries cannot be edited.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'activity_id' => 'required|exists:timesheet_activities,id',
            'hours' => 'required|numeric|min:0.25|max:24',
            'notes' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $activity = TimesheetActivity::where('institution_id', $entry->institution_id)
            ->where('user_id', $entry->user_id)
            ->find($request->activity_id);

        if (!$activity) {
            return response()->json(['message' => 'Activity not found.'], 422);
        }

        $entry->fill([
            'activity_id' => $activity->id,
            'work_date' => Carbon::parse($request->date)->toDateString(),
            'hours_worked' => $request->hours,
            'description' => $request->notes,
            'notes' => $request->notes,
            'status' => 'pending',
        ]);

        $this->weekService->applyOvertimeFlags($entry);
        $entry->save();

        return response()->json(['message' => 'Entry updated.', 'entry' => $entry->load('activity.category')]);
    }

    public function destroyEntry(Request $request, TimesheetEntry $entry)
    {
        if (!$this->canAccessInstitution($request, $entry->institution_id)) {
            return response()->json(['message' => 'Entry not found.'], 404);
        }
        if (!$this->canModifyOwnResource($request, (int) $entry->user_id, ['timesheets.manage', 'delete_own_timesheet'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        if ($entry->status === 'approved') {
            return response()->json(['message' => 'Approved entries cannot be deleted.'], 422);
        }

        $entry->delete();

        return response()->json(['message' => 'Entry deleted.']);
    }

    // --- Admin ---

    public function manageAll(Request $request)
    {
        if (!$this->hasAnyPermission($request, ['view_all_timesheets', 'timesheets.manage', 'timesheets.review'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $institutionId = $this->institutionId($request);

        $query = TimesheetEntry::query()
            ->with(['activity.category', 'user:id,name,email'])
            ->where('institution_id', $institutionId)
            ->whereNotNull('user_id');

        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('month')) {
            $month = Carbon::parse($request->month . '-01');
            $query->whereBetween('work_date', [$month->startOfMonth()->toDateString(), $month->copy()->endOfMonth()->toDateString()]);
        }

        $entries = $query->orderByDesc('work_date')->paginate(50);
        $totalHours = (float) (clone $query)->sum('hours_worked');

        return response()->json([
            'entries' => $entries,
            'total_hours' => round($totalHours, 2),
        ]);
    }

    public function approveEntry(Request $request, TimesheetEntry $entry)
    {
        return $this->reviewEntry($request, $entry, 'approved');
    }

    public function rejectEntry(Request $request, TimesheetEntry $entry)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:2000',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return $this->reviewEntry($request, $entry, 'rejected', $request->reason);
    }

    public function report(Request $request)
    {
        if (!$this->hasAnyPermission($request, ['view_timesheet_reports', 'timesheets.report', 'timesheets.view_timesheet_reports'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'user_id' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $institutionId = $this->institutionId($request);
        $users = $this->resolveReportUsers($request, $institutionId);
        $reports = [];

        foreach ($users as $user) {
            $reports[] = $this->buildEmployeeReport($institutionId, $user, $request->from_date, $request->to_date);
        }

        return response()->json(['reports' => $reports]);
    }

    public function overtimeReport(Request $request)
    {
        if (!$this->hasAnyPermission($request, ['view_overtime_reports', 'view_timesheet_reports', 'timesheets.report'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'user_id' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $institutionId = $this->institutionId($request);
        $users = $this->resolveReportUsers($request, $institutionId);
        $reports = [];

        foreach ($users as $user) {
            $report = $this->buildEmployeeReport($institutionId, $user, $request->from_date, $request->to_date);
            if ($report['overtime_hours'] > 0 || $report['actual_hours'] > $report['expected_hours']) {
                $reports[] = $report;
            }
        }

        return response()->json(['reports' => $reports]);
    }

    // --- Helpers ---

    protected function buildEmployeeReport($institutionId, User $user, $from, $to)
    {
        $entries = TimesheetEntry::query()
            ->with('activity')
            ->where('institution_id', $institutionId)
            ->where('user_id', $user->id)
            ->whereBetween('work_date', [$from, $to])
            ->where('status', '!=', 'rejected')
            ->orderBy('work_date')
            ->get();

        $expectedHours = $this->weekService->expectedPeriodHours($institutionId, $user->id, $from, $to);
        $actualHours = round((float) $entries->sum('hours_worked'), 2);
        $approvedHours = round((float) $entries->where('status', 'approved')->sum('hours_worked'), 2);
        $pendingHours = round((float) $entries->where('status', 'pending')->sum('hours_worked'), 2);
        $overtimeHours = round(max($actualHours - $expectedHours, 0), 2);
        $underTimeHours = round(max($expectedHours - $actualHours, 0), 2);

        $weeklyExpected = round(collect(range(1, 7))->sum(function ($day) use ($institutionId, $user) {
            $row = TimesheetWorkingWeek::where('institution_id', $institutionId)
                ->where('user_id', $user->id)
                ->where('day_of_week', $day)
                ->where('is_working_day', true)
                ->first();

            if (!$row) {
                return in_array($day, [1, 2, 3, 4, 5]) ? 8 : 0;
            }

            return ($row->expected_minutes ?: $this->weekService->calculateExpectedMinutes($row->start_time, $row->end_time, $row->break_minutes)) / 60;
        }), 2);

        return [
            'employee' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            'expected_weekly_hours' => $weeklyExpected,
            'expected_hours' => $expectedHours,
            'actual_hours' => $actualHours,
            'approved_hours' => $approvedHours,
            'pending_hours' => $pendingHours,
            'overtime_hours' => $overtimeHours,
            'under_time_hours' => $underTimeHours,
            'activities' => $entries->groupBy('activity.name')->map->count(),
            'notes' => $entries->pluck('notes')->filter()->values(),
            'daily_breakdown' => $entries->groupBy(function ($entry) {
                return $entry->work_date->format('Y-m-d');
            })->map(function ($dayEntries, $date) use ($institutionId, $user) {
                $dayHours = round((float) $dayEntries->sum('hours_worked'), 2);
                $expected = $this->weekService->expectedDailyHours($institutionId, $user->id, $date);

                return [
                    'date' => $date,
                    'expected_hours' => $expected,
                    'actual_hours' => $dayHours,
                    'overtime_hours' => round(max($dayHours - $expected, 0), 2),
                    'entries' => $dayEntries->values(),
                ];
            })->values(),
            'overtime_entries' => $entries->where('is_overtime', true)->values(),
        ];
    }

    protected function resolveReportUsers(Request $request, $institutionId)
    {
        if ($request->filled('user_id') && $request->user_id !== 'all') {
            return User::where('institution_id', $institutionId)->where('id', $request->user_id)->get();
        }

        $userIds = TimesheetEntry::where('institution_id', $institutionId)
            ->whereNotNull('user_id')
            ->distinct()
            ->pluck('user_id');

        return User::whereIn('id', $userIds)->orderBy('name')->get();
    }

    protected function buildWorkingWeekSummary($rows)
    {
        $collection = collect($rows);
        $workingDays = $collection->filter(function ($row) {
            return (bool) (is_array($row) ? $row['is_working_day'] : $row->is_working_day);
        });

        $totalMinutes = $workingDays->sum(function ($row) {
            if (is_array($row)) {
                return (int) ($row['expected_minutes'] ?? 0);
            }

            return (int) ($row->expected_minutes ?: $this->weekService->calculateExpectedMinutes($row->start_time, $row->end_time, $row->break_minutes));
        });

        $breakMinutes = $workingDays->avg(function ($row) {
            return is_array($row) ? ($row['break_minutes'] ?? 0) : ($row->break_minutes ?? 0);
        });

        return [
            'working_days' => $workingDays->count(),
            'total_expected_hours' => round($totalMinutes / 60, 2),
            'break_minutes' => (int) round($breakMinutes ?: 0),
        ];
    }

    protected function resolveWorkingWeekUserId(Request $request)
    {
        if ($this->hasAnyPermission($request, ['timesheets.manage']) && $request->filled('user_id')) {
            return (int) $request->user_id;
        }

        return (int) $request->user()->id;
    }

    protected function reviewEntry(Request $request, TimesheetEntry $entry, $status, $reason = null)
    {
        if (!$this->canAccessInstitution($request, $entry->institution_id)) {
            return response()->json(['message' => 'Entry not found.'], 404);
        }
        if (!$this->hasAnyPermission($request, ['approve_timesheets', 'reject_timesheets', 'timesheets.review'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $entry->status = $status;
        $entry->approved_by = optional($request->user())->id;
        $entry->approved_at = Carbon::now();
        $entry->rejection_reason = $status === 'rejected' ? $reason : null;
        $entry->save();

        return response()->json(['message' => 'Entry ' . $status . '.', 'entry' => $entry->load('activity', 'user')]);
    }

    protected function institutionId(Request $request)
    {
        return (int) (optional($request->user())->institution_id ?: $request->get('institution_id', 1));
    }

    protected function canAccessInstitution(Request $request, $institutionId)
    {
        return (int) $this->institutionId($request) === (int) $institutionId;
    }

    protected function hasAnyPermission(Request $request, array $permissions)
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }
        if ($user->hasRole('super-admin')) {
            return true;
        }
        foreach ($permissions as $permission) {
            if ($user->hasPermissionTo($permission)) {
                return true;
            }
        }

        return false;
    }

    protected function canModifyOwnResource(Request $request, $ownerId, array $adminPermissions = [])
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }
        if ((int) $user->id === (int) $ownerId) {
            return true;
        }

        return $this->hasAnyPermission($request, $adminPermissions);
    }
}
