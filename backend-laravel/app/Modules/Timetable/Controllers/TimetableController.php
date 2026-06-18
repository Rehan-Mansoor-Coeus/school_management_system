<?php

namespace App\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Models\TimetableEntry;
use App\Modules\Timetable\Models\TimetableSetting;
use App\Modules\Timetable\Services\TimetableGeneratorService;
use App\Modules\Timetable\Services\TimetableService;
use App\Modules\Timetable\Services\WorkloadService;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    use ResolvesInstitution;

    protected $service;
    protected $generator;
    protected $workload;

    public function __construct(TimetableService $service, TimetableGeneratorService $generator, WorkloadService $workload)
    {
        $this->service = $service;
        $this->generator = $generator;
        $this->workload = $workload;
    }

    public function index(Request $request)
    {
        $items = $this->service->list($this->institutionId(), $request->only([
            'department_id', 'programme_id', 'programme_semester_id', 'teacher_id',
            'classroom_id', 'course_id', 'day_of_week', 'status', 'academic_year',
        ]));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);
        $institutionId = $this->institutionId();

        $conflicts = $this->service->detectConflicts($institutionId, $data);
        if (! empty($conflicts) && ! $request->boolean('force')) {
            return response()->json(['success' => false, 'message' => 'Scheduling conflict detected.', 'conflicts' => $conflicts], 422);
        }

        $warnings = $this->loadWarning($institutionId, $data);
        $entry = $this->service->create($institutionId, (int) auth()->id(), $data);

        return response()->json(['success' => true, 'data' => $entry->fresh(), 'warnings' => $warnings], 201);
    }

    public function update(Request $request, $id)
    {
        $entry = TimetableEntry::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $this->validatePayload($request, false);

        $merged = array_merge($entry->toArray(), $data);
        $conflicts = $this->service->detectConflicts($this->institutionId(), $merged, $entry->id);
        if (! empty($conflicts) && ! $request->boolean('force')) {
            return response()->json(['success' => false, 'message' => 'Scheduling conflict detected.', 'conflicts' => $conflicts], 422);
        }

        $updated = $this->service->update($entry, $data);

        return response()->json(['success' => true, 'data' => $updated]);
    }

    public function destroy($id)
    {
        $entry = TimetableEntry::where('institution_id', $this->institutionId())->findOrFail($id);
        $this->service->delete($entry);

        return response()->json(['success' => true, 'data' => ['deleted' => true]]);
    }

    public function checkConflicts(Request $request)
    {
        $data = $request->validate([
            'day_of_week' => 'required|integer|min:1|max:7',
            'start_time' => 'required',
            'end_time' => 'required',
            'teacher_id' => 'nullable|integer',
            'classroom_id' => 'nullable|integer',
            'programme_semester_id' => 'nullable|integer',
            'ignore_id' => 'nullable|integer',
        ]);

        $conflicts = $this->service->detectConflicts($this->institutionId(), $data, $data['ignore_id'] ?? null);

        return response()->json(['success' => true, 'data' => ['conflicts' => $conflicts]]);
    }

    public function generate(Request $request)
    {
        $params = $request->validate([
            'department_id' => 'nullable|integer',
            'programme_id' => 'nullable|integer',
            'programme_semester_id' => 'nullable|integer',
            'academic_year' => 'nullable|string|max:50',
            'replace' => 'nullable|boolean',
        ]);

        $result = $this->generator->generate($this->institutionId(), (int) auth()->id(), $params);

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function approve(Request $request, $id)
    {
        $entry = TimetableEntry::where('institution_id', $this->institutionId())->findOrFail($id);
        $entry->update([
            'status' => $request->input('status', 'approved'),
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $entry->fresh()]);
    }

    protected function loadWarning(int $institutionId, array $data): array
    {
        $warnings = [];
        if (! empty($data['teacher_id'])) {
            $settings = TimetableSetting::forInstitution($institutionId);
            $current = $this->workload->weeklyHoursForTeacher($institutionId, (int) $data['teacher_id']);
            $minutes = \Illuminate\Support\Carbon::parse($data['end_time'])->diffInMinutes(\Illuminate\Support\Carbon::parse($data['start_time']));
            $projected = $current + round($minutes / 60, 2);
            if ($projected > $settings->max_weekly_teaching_hours) {
                $warnings[] = "Teacher weekly load ({$projected}h) exceeds the maximum of {$settings->max_weekly_teaching_hours}h.";
            }
        }

        return $warnings;
    }

    protected function validatePayload(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'course_id' => ($creating ? 'required' : 'sometimes').'|integer',
            'teacher_id' => 'nullable|integer',
            'classroom_id' => 'nullable|integer',
            'assignment_id' => 'nullable|integer',
            'department_id' => 'nullable|integer',
            'programme_id' => 'nullable|integer',
            'programme_semester_id' => 'nullable|integer',
            'academic_year' => 'nullable|string|max:50',
            'day_of_week' => ($creating ? 'required' : 'sometimes').'|integer|min:1|max:7',
            'start_time' => ($creating ? 'required' : 'sometimes'),
            'end_time' => ($creating ? 'required' : 'sometimes'),
            'status' => 'nullable|in:draft,approved,published',
        ]);
    }
}
