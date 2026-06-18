<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\StaffWorkingSchedule;
use App\Timesheet;
use App\TimesheetActivity;
use App\TimesheetApproval;
use App\TimesheetAuditLog;
use App\TimesheetEntry;
use App\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TimesheetController extends Controller
{
    public function activities(Request $request)
    {
        return response()->json(
            TimesheetActivity::query()
                ->where('institution_id', $this->institutionId($request))
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
        );
    }

    public function storeActivity(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:60',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $activity = TimesheetActivity::create([
            'institution_id' => $this->institutionId($request),
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'is_active' => $request->get('is_active', true),
            'created_by' => optional($request->user())->id,
        ]);

        return response()->json(['message' => 'Activity created.', 'activity' => $activity], 201);
    }

    public function myTimesheets(Request $request)
    {
        $institutionId = $this->institutionId($request);
        $user = $request->user();

        $timesheets = Timesheet::query()
            ->with(['entries.activity'])
            ->where('institution_id', $institutionId)
            ->where('staff_id', $user->id)
            ->orderByDesc('week_start_date')
            ->paginate(20);

        return response()->json($timesheets);
    }

    public function createOrGetWeekly(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'week_start_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institutionId = $this->institutionId($request);
        $staffId = $request->user()->id;
        $weekStart = Carbon::parse($request->week_start_date)->startOfWeek(Carbon::MONDAY)->toDateString();
        $weekEnd = Carbon::parse($weekStart)->endOfWeek(Carbon::SUNDAY)->toDateString();

        $timesheet = Timesheet::firstOrCreate(
            [
                'institution_id' => $institutionId,
                'staff_id' => $staffId,
                'week_start_date' => $weekStart,
            ],
            [
                'week_end_date' => $weekEnd,
                'status' => 'draft',
            ]
        );

        if ($timesheet->wasRecentlyCreated) {
            $this->logEvent($institutionId, $timesheet->id, null, $request->user()->id, 'create', [
                'week_start_date' => $weekStart,
            ]);
        }

        $this->recalculateTimesheetMetrics($timesheet);

        return response()->json($timesheet->load('entries.activity'));
    }

    public function addEntry(Request $request, Timesheet $timesheet)
    {
        $institutionId = $this->institutionId($request);
        if (!$this->canModifyTimesheet($request, $timesheet, $institutionId)) {
            return response()->json(['message' => 'Not authorized to modify this timesheet.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'work_date' => 'required|date',
            'activity_id' => 'required|exists:timesheet_activities,id',
            'hours_worked' => 'required|numeric|min:0.25|max:24',
            'description' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $workDate = Carbon::parse($request->work_date)->toDateString();
        if ($workDate < $timesheet->week_start_date->toDateString() || $workDate > $timesheet->week_end_date->toDateString()) {
            return response()->json(['message' => 'Entry date must be within selected week.'], 422);
        }

        $activity = TimesheetActivity::where('institution_id', $institutionId)->where('id', $request->activity_id)->first();
        if (!$activity) {
            return response()->json(['message' => 'Activity not found for your institution.'], 422);
        }

        $entry = TimesheetEntry::create([
            'institution_id' => $institutionId,
            'timesheet_id' => $timesheet->id,
            'activity_id' => $request->activity_id,
            'work_date' => $workDate,
            'hours_worked' => $request->hours_worked,
            'description' => $request->description,
        ]);

        $timesheet->status = 'draft';
        $timesheet->submitted_at = null;
        $timesheet->approved_at = null;
        $timesheet->approved_by = null;
        $timesheet->rejection_reason = null;
        $timesheet->correction_reason = null;
        $timesheet->save();

        $this->recalculateTimesheetMetrics($timesheet);
        $this->logEvent($institutionId, $timesheet->id, $entry->id, optional($request->user())->id, 'update', [
            'entry_action' => 'create',
        ]);

        return response()->json(['message' => 'Timesheet entry added.', 'entry' => $entry], 201);
    }

    public function submit(Request $request, Timesheet $timesheet)
    {
        $institutionId = $this->institutionId($request);
        if (!$this->canModifyTimesheet($request, $timesheet, $institutionId)) {
            return response()->json(['message' => 'Not authorized to submit this timesheet.'], 403);
        }

        if ($timesheet->entries()->count() === 0) {
            return response()->json(['message' => 'Cannot submit an empty timesheet.'], 422);
        }

        $timesheet->status = 'submitted';
        $timesheet->submitted_at = Carbon::now();
        $timesheet->save();

        $this->recalculateTimesheetMetrics($timesheet);
        $this->logEvent($institutionId, $timesheet->id, null, optional($request->user())->id, 'submit', null);

        return response()->json(['message' => 'Timesheet submitted.', 'timesheet' => $timesheet->fresh('entries.activity')]);
    }

    public function approvals(Request $request)
    {
        $institutionId = $this->institutionId($request);

        $query = Timesheet::query()
            ->with(['staff:id,name,email', 'entries.activity'])
            ->where('institution_id', $institutionId)
            ->whereIn('status', ['submitted', 'correction_requested', 'rejected']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderByDesc('submitted_at')->paginate(20));
    }

    public function approve(Request $request, Timesheet $timesheet)
    {
        return $this->applyDecision($request, $timesheet, 'approved', 'approve');
    }

    public function reject(Request $request, Timesheet $timesheet)
    {
        return $this->applyDecision($request, $timesheet, 'rejected', 'reject', true);
    }

    public function requestCorrection(Request $request, Timesheet $timesheet)
    {
        return $this->applyDecision($request, $timesheet, 'correction_requested', 'request_correction', true);
    }

    public function reports(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'range' => 'required|in:weekly,monthly',
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institutionId = $this->institutionId($request);

        $rows = Timesheet::query()
            ->with(['staff:id,name,email'])
            ->where('institution_id', $institutionId)
            ->whereBetween('week_start_date', [$request->from, $request->to])
            ->orderBy('week_start_date')
            ->get();

        $grouped = $rows->groupBy(function ($timesheet) use ($request) {
            return $request->range === 'monthly'
                ? Carbon::parse($timesheet->week_start_date)->format('Y-m')
                : Carbon::parse($timesheet->week_start_date)->format('o-\WW');
        });

        $report = $grouped->map(function ($items, $bucket) {
            return [
                'period' => $bucket,
                'submitted_hours' => round((float) $items->sum('total_submitted_hours'), 2),
                'expected_hours' => round((float) $items->sum('total_expected_hours'), 2),
                'overtime_hours' => round((float) $items->sum('overtime_hours'), 2),
                'under_time_hours' => round((float) $items->sum('under_time_hours'), 2),
                'timesheets' => $items->count(),
            ];
        })->values();

        return response()->json(['rows' => $report]);
    }

    public function schedules(Request $request)
    {
        $institutionId = $this->institutionId($request);

        $query = StaffWorkingSchedule::query()->where('institution_id', $institutionId);
        if ($request->filled('staff_id')) {
            $query->where('staff_id', $request->staff_id);
        }

        return response()->json($query->orderBy('staff_id')->orderBy('weekday')->get());
    }

    public function upsertSchedule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:users,id',
            'weekday' => 'required|integer|min:1|max:7',
            'expected_hours' => 'required|numeric|min:0|max:24',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institutionId = $this->institutionId($request);
        $staff = User::where('institution_id', $institutionId)->where('id', $request->staff_id)->first();
        if (!$staff) {
            return response()->json(['message' => 'Staff member does not belong to your institution.'], 422);
        }

        $schedule = StaffWorkingSchedule::updateOrCreate(
            [
                'institution_id' => $institutionId,
                'staff_id' => $request->staff_id,
                'weekday' => $request->weekday,
                'effective_from' => $request->effective_from,
            ],
            [
                'expected_hours' => $request->expected_hours,
                'effective_to' => $request->effective_to,
                'is_active' => $request->get('is_active', true),
            ]
        );

        return response()->json(['message' => 'Working schedule saved.', 'schedule' => $schedule]);
    }

    protected function applyDecision(Request $request, Timesheet $timesheet, $targetStatus, $event, $reasonRequired = false)
    {
        $validator = Validator::make($request->all(), [
            'reason' => ($reasonRequired ? 'required' : 'nullable') . '|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institutionId = $this->institutionId($request);
        if ((int) $timesheet->institution_id !== (int) $institutionId) {
            return response()->json(['message' => 'Timesheet not found.'], 404);
        }

        if (!in_array($timesheet->status, ['submitted', 'correction_requested'])) {
            return response()->json(['message' => 'Only submitted timesheets can be reviewed.'], 422);
        }

        DB::transaction(function () use ($request, $timesheet, $targetStatus, $event, $institutionId) {
            $timesheet->status = $targetStatus;
            $timesheet->approved_by = optional($request->user())->id;
            $timesheet->approved_at = Carbon::now();
            $timesheet->rejection_reason = $event === 'reject' ? $request->reason : null;
            $timesheet->correction_reason = $event === 'request_correction' ? $request->reason : null;
            $timesheet->save();

            TimesheetApproval::create([
                'institution_id' => $institutionId,
                'timesheet_id' => $timesheet->id,
                'acted_by' => optional($request->user())->id,
                'action' => $event,
                'comment' => $request->reason,
                'acted_at' => Carbon::now(),
            ]);
        });

        $this->logEvent($institutionId, $timesheet->id, null, optional($request->user())->id, $event, [
            'reason' => $request->reason,
        ]);

        return response()->json(['message' => 'Review action saved.', 'timesheet' => $timesheet->fresh('entries.activity')]);
    }

    protected function recalculateTimesheetMetrics(Timesheet $timesheet)
    {
        $submittedHours = (float) $timesheet->entries()->sum('hours_worked');
        $expectedHours = 0;

        $cursor = Carbon::parse($timesheet->week_start_date)->copy();
        $weekEnd = Carbon::parse($timesheet->week_end_date);
        while ($cursor->lte($weekEnd)) {
            $schedule = StaffWorkingSchedule::query()
                ->where('institution_id', $timesheet->institution_id)
                ->where('staff_id', $timesheet->staff_id)
                ->where('weekday', $cursor->dayOfWeekIso)
                ->where('is_active', true)
                ->where('effective_from', '<=', $cursor->toDateString())
                ->where(function ($query) use ($cursor) {
                    $query->whereNull('effective_to')->orWhere('effective_to', '>=', $cursor->toDateString());
                })
                ->orderByDesc('effective_from')
                ->first();

            $expectedHours += (float) optional($schedule)->expected_hours;
            $cursor->addDay();
        }

        $timesheet->total_submitted_hours = round($submittedHours, 2);
        $timesheet->total_expected_hours = round($expectedHours, 2);
        $timesheet->overtime_hours = round(max($submittedHours - $expectedHours, 0), 2);
        $timesheet->under_time_hours = round(max($expectedHours - $submittedHours, 0), 2);
        $timesheet->save();
    }

    protected function canModifyTimesheet(Request $request, Timesheet $timesheet, $institutionId)
    {
        if ((int) $timesheet->institution_id !== (int) $institutionId) {
            return false;
        }

        $user = $request->user();
        if (!$user) {
            return false;
        }

        if ($user->can('timesheets.manage')) {
            return true;
        }

        return (int) $timesheet->staff_id === (int) $user->id;
    }

    protected function institutionId(Request $request)
    {
        return (int) (optional($request->user())->institution_id ?: $request->get('institution_id', 1));
    }

    protected function logEvent($institutionId, $timesheetId, $entryId, $actorId, $event, $metadata)
    {
        TimesheetAuditLog::create([
            'institution_id' => $institutionId,
            'timesheet_id' => $timesheetId,
            'entry_id' => $entryId,
            'actor_id' => $actorId,
            'event' => $event,
            'metadata' => $metadata,
        ]);
    }
}
