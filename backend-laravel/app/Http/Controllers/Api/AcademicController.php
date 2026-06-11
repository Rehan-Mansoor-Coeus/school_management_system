<?php

namespace App\Http\Controllers\Api;

use App\Department;
use App\AcademicUnit;
use App\Institution;
use App\ProgramSubject;
use App\Programme;
use App\ProgrammeLevel;
use App\ProgrammeRequiredDocument;
use App\AdmissionAgreement;
use App\ProgrammeSemester;
use App\ProgrammeSemesterSubject;
use App\Subject;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AcademicController extends Controller
{
    protected function getInstitutionId(Request $request)
    {
        if ($request->filled('institution_id')) {
            return (int) $request->input('institution_id');
        }

        return optional($request->user())->institution_id;
    }

    protected function ensureInstitutionId(Request $request)
    {
        $institutionId = $this->getInstitutionId($request);
        if (! $institutionId) {
            abort(422, 'No institution assigned to current user.');
        }
        return $institutionId;
    }

    public function programs(Request $request)
    {
        $institutionId = $this->ensureInstitutionId($request);

        $query = Programme::with(['department', 'requiredDocuments', 'admissionAgreement', 'levels.semesters.assignments.subject', 'semesters.assignments.subject'])
            ->where('institution_id', $institutionId);

        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('description', 'like', $term);
            });
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function showProgram(Request $request, Programme $programme)
    {
        if ($programme->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Program not found.'], 404);
        }

        return response()->json($programme->load(['department', 'requiredDocuments', 'admissionAgreement', 'levels.semesters.assignments.subject', 'semesters.assignments.subject']));
    }

    public function storeProgram(Request $request)
    {
        $institutionId = $this->ensureInstitutionId($request);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('programmes')->where(fn ($query) => $query->where('institution_id', $institutionId)),
            ],
            'description' => 'nullable|string|max:1000',
            'duration_years' => 'required|integer|min:1|max:20',
            'level' => ['required', Rule::in(['certificate', 'diploma', 'degree', 'bachelor', 'master', 'phd', 'crash_course', 'other'])],
            'semester_count' => 'required|integer|min:1|max:20',
            'department_id' => ['required', 'integer', Rule::exists('departments', 'id')->where(fn ($query) => $query->where('institution_id', $institutionId))],
            'academic_unit_id' => ['nullable', 'integer', Rule::exists('academic_units', 'id')->where(fn ($query) => $query->where('institution_id', $institutionId))],
            'duration_value' => 'nullable|integer|min:1|max:20',
            'duration_unit' => 'nullable|in:months,years',
            'tuition_fee' => 'nullable|numeric|min:0',
            'application_fee' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'required_documents' => 'nullable|array',
            'required_documents.*.name' => 'required_with:required_documents|string|max:255',
            'required_documents.*.description' => 'nullable|string|max:1000',
            'required_documents.*.is_required' => 'nullable|boolean',
            'required_documents.*.sort_order' => 'nullable|integer|min:0',
            'agreement' => 'nullable|array',
            'agreement.title' => 'nullable|string|max:255',
            'agreement.content' => 'nullable|string|max:50000',
            'agreement.is_required' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $durationValue = (int) $request->input('duration_value', $request->duration_years);
        $durationUnit = $request->input('duration_unit', 'years');
        $durationYears = $durationUnit === 'months'
            ? max(1, (int) ceil($durationValue / 12))
            : max(1, $durationValue);

        $programme = Programme::create([
            'institution_id' => $institutionId,
            'department_id' => $request->department_id,
            'academic_unit_id' => $request->academic_unit_id,
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'duration_years' => $durationYears,
            'duration_value' => $durationValue,
            'duration_unit' => $durationUnit,
            'level' => $request->level,
            'semester_count' => $request->semester_count,
            'tuition_fee' => $request->input('tuition_fee', 0),
            'application_fee' => $request->input('application_fee', 0),
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : true,
        ]);

        for ($index = 1; $index <= $programme->semester_count; $index++) {
            ProgrammeSemester::create([
                'programme_id' => $programme->id,
                'semester_number' => $index,
                'name' => "Semester {$index}",
            ]);
        }

        $this->syncLevelsForProgramme($programme);

        $this->syncRequiredDocuments($programme, $request->input('required_documents', []));
        $this->syncProgrammeAgreement($programme, $request->input('agreement'));

        return response()->json($programme->load(['department', 'requiredDocuments', 'admissionAgreement', 'levels.semesters.assignments.subject', 'semesters.assignments.subject']), 201);
    }

    public function updateProgram(Request $request, Programme $programme)
    {
        if ($programme->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Program not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('programmes')->ignore($programme->id)->where(fn ($query) => $query->where('institution_id', $programme->institution_id)),
            ],
            'description' => 'nullable|string|max:1000',
            'duration_years' => 'required|integer|min:1|max:20',
            'level' => ['required', Rule::in(['certificate', 'diploma', 'degree', 'bachelor', 'master', 'phd', 'crash_course', 'other'])],
            'semester_count' => 'required|integer|min:1|max:20',
            'department_id' => ['required', 'integer', Rule::exists('departments', 'id')->where(fn ($query) => $query->where('institution_id', $programme->institution_id))],
            'tuition_fee' => 'nullable|numeric|min:0',
            'application_fee' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'semesters' => 'nullable|array',
            'semesters.*.id' => 'required_with:semesters|integer|exists:programme_semesters,id',
            'semesters.*.name' => 'required_with:semesters|string|max:255',
            'semesters.*.is_active' => 'nullable|boolean',
            'required_documents' => 'nullable|array',
            'required_documents.*.id' => 'nullable|integer|exists:programme_required_documents,id',
            'required_documents.*.name' => 'required_with:required_documents|string|max:255',
            'required_documents.*.description' => 'nullable|string|max:1000',
            'required_documents.*.is_required' => 'nullable|boolean',
            'required_documents.*.sort_order' => 'nullable|integer|min:0',
            'agreement' => 'nullable|array',
            'agreement.title' => 'nullable|string|max:255',
            'agreement.content' => 'nullable|string|max:50000',
            'agreement.is_required' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $programme->update([
            'department_id' => $request->department_id,
            'academic_unit_id' => $request->input('academic_unit_id', $programme->academic_unit_id),
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'duration_years' => $request->duration_years,
            'duration_value' => $request->input('duration_value', $programme->duration_value ?: $request->duration_years),
            'duration_unit' => $request->input('duration_unit', $programme->duration_unit ?: 'years'),
            'level' => $request->level,
            'semester_count' => $request->semester_count,
            'tuition_fee' => $request->input('tuition_fee', $programme->tuition_fee),
            'application_fee' => $request->input('application_fee', $programme->application_fee),
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : $programme->is_active,
        ]);

        if ($request->filled('semesters')) {
            foreach ($request->semesters as $semesterData) {
                ProgrammeSemester::where('programme_id', $programme->id)
                    ->where('id', $semesterData['id'])
                    ->update([
                        'name' => $semesterData['name'],
                        'is_active' => isset($semesterData['is_active']) ? (bool) $semesterData['is_active'] : true,
                    ]);
            }
        }

        $currentCount = $programme->semesters()->count();
        if ($request->semester_count > $currentCount) {
            for ($index = $currentCount + 1; $index <= $request->semester_count; $index++) {
                ProgrammeSemester::create([
                    'programme_id' => $programme->id,
                    'semester_number' => $index,
                    'name' => "Semester {$index}",
                ]);
            }
        }

        if ($request->semester_count < $currentCount) {
            ProgrammeSemester::where('programme_id', $programme->id)
                ->where('semester_number', '>', $request->semester_count)
                ->delete();
        }

        $this->syncLevelsForProgramme($programme->fresh());

        $this->syncRequiredDocuments($programme, $request->input('required_documents', []));
        $this->syncProgrammeAgreement($programme, $request->input('agreement'));

        return response()->json($programme->fresh()->load(['department', 'requiredDocuments', 'admissionAgreement', 'levels.semesters.assignments.subject', 'semesters.assignments.subject']));
    }

    public function destroyProgram(Request $request, Programme $programme)
    {
        if ($programme->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Program not found.'], 404);
        }

        $programme->delete();

        return response()->json(['message' => 'Program deleted successfully.']);
    }

    public function subjects(Request $request)
    {
        $institutionId = $this->ensureInstitutionId($request);

        $query = Subject::where('institution_id', $institutionId);
        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('description', 'like', $term);
            });
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function storeSubject(Request $request)
    {
        $institutionId = $this->ensureInstitutionId($request);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('subjects')->where(fn ($query) => $query->where('institution_id', $institutionId)),
            ],
            'default_contact_hours' => 'required|integer|min:0',
            'credit_hours' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subject = Subject::create([
            'institution_id' => $institutionId,
            'name' => $request->name,
            'code' => $request->code,
            'credit_hours' => $request->input('credit_hours'),
            'default_contact_hours' => $request->default_contact_hours,
            'description' => $request->description,
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : true,
        ]);

        return response()->json($subject, 201);
    }

    public function updateSubject(Request $request, Subject $subject)
    {
        if ($subject->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Subject not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:100',
                Rule::unique('subjects')->ignore($subject->id)->where(fn ($query) => $query->where('institution_id', $subject->institution_id)),
            ],
            'default_contact_hours' => 'required|integer|min:0',
            'credit_hours' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subject->update([
            'name' => $request->name,
            'code' => $request->code,
            'credit_hours' => $request->input('credit_hours', $subject->credit_hours),
            'default_contact_hours' => $request->default_contact_hours,
            'description' => $request->description,
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : $subject->is_active,
        ]);

        return response()->json($subject);
    }

    public function deleteSubject(Request $request, Subject $subject)
    {
        if ($subject->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Subject not found.'], 404);
        }

        $subject->delete();

        return response()->json(['message' => 'Subject deleted successfully.']);
    }

    public function updateSemester(Request $request, ProgrammeSemester $semester)
    {
        $programme = $semester->programme;
        if ($programme->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Semester not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'is_active' => 'nullable|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'academic_year' => 'nullable|string|max:20',
            'total_semester_fee' => 'nullable|numeric|min:0',
            'expected_payment_date' => 'nullable|date',
            'latest_payment_date' => 'nullable|date',
            'programme_level_id' => 'nullable|integer|exists:programme_levels,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $semester->update([
            'name' => $request->name,
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : $semester->is_active,
            'start_date' => $request->input('start_date', $semester->start_date),
            'end_date' => $request->input('end_date', $semester->end_date),
            'academic_year' => $request->input('academic_year', $semester->academic_year),
            'total_semester_fee' => $request->input('total_semester_fee', $semester->total_semester_fee),
            'expected_payment_date' => $request->input('expected_payment_date', $semester->expected_payment_date),
            'latest_payment_date' => $request->input('latest_payment_date', $semester->latest_payment_date),
            'programme_level_id' => $request->input('programme_level_id', $semester->programme_level_id),
        ]);

        return response()->json($semester->fresh(['level']));
    }

    public function assignSubject(Request $request, Programme $programme)
    {
        if ($programme->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Program not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'programme_semester_id' => ['required', 'integer', Rule::exists('programme_semesters', 'id')->where(fn ($query) => $query->where('programme_id', $programme->id))],
            'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')->where(fn ($query) => $query->where('institution_id', $programme->institution_id))],
            'contact_hours' => 'nullable|integer|min:0',
            'is_required' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subject = Subject::findOrFail($request->subject_id);
        $assignment = ProgrammeSemesterSubject::updateOrCreate(
            ['programme_semester_id' => $request->programme_semester_id, 'subject_id' => $request->subject_id],
            [
                'contact_hours' => $request->filled('contact_hours') ? $request->contact_hours : $subject->default_contact_hours,
                'is_required' => $request->has('is_required') ? (bool) $request->is_required : true,
                'is_active' => $request->filled('is_active') ? (bool) $request->is_active : true,
            ]
        );

        return response()->json($assignment->load('subject'), 201);
    }

    public function updateSemesterSubject(Request $request, ProgrammeSemesterSubject $assignment)
    {
        $programme = $assignment->semester->programme;
        if ($programme->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'contact_hours' => 'required|integer|min:0',
            'is_required' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $assignment->update([
            'contact_hours' => $request->contact_hours,
            'is_required' => $request->has('is_required') ? (bool) $request->is_required : $assignment->is_required,
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : $assignment->is_active,
        ]);

        return response()->json($assignment->load('subject'));
    }

    public function deleteSemesterSubject(Request $request, ProgrammeSemesterSubject $assignment)
    {
        $programme = $assignment->semester->programme;
        if ($programme->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $assignment->delete();

        return response()->json(['message' => 'Subject removed from semester.']);
    }

    public function storeLevel(Request $request, Programme $programme)
    {
        if ($programme->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Program not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'level_number' => 'required|integer|min:1',
            'name' => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $level = ProgrammeLevel::create([
            'programme_id' => $programme->id,
            'level_number' => $request->level_number,
            'name' => $request->name,
            'sort_order' => $request->input('sort_order', $programme->levels()->count() + 1),
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : true,
        ]);

        return response()->json($level->load('semesters'), 201);
    }

    public function updateLevel(Request $request, ProgrammeLevel $level)
    {
        $programme = $level->programme;
        if ($programme->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Level not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'level_number' => 'required|integer|min:1',
            'name' => 'required|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $level->update([
            'level_number' => $request->level_number,
            'name' => $request->name,
            'sort_order' => $request->input('sort_order', $level->sort_order),
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : $level->is_active,
        ]);

        return response()->json($level->fresh('semesters'));
    }

    protected function syncLevelsForProgramme(Programme $programme): void
    {
        if (! Schema::hasTable('programme_levels')) {
            return;
        }

        $years = max(1, (int) $programme->duration_years);
        $levelIds = [];

        for ($i = 0; $i < $years; $i++) {
            $levelNumber = 100 + ($i * 100);
            $level = ProgrammeLevel::firstOrCreate(
                ['programme_id' => $programme->id, 'level_number' => $levelNumber],
                [
                    'name' => 'Level '.$levelNumber,
                    'sort_order' => $i + 1,
                    'is_active' => true,
                ]
            );
            $levelIds[] = $level->id;
        }

        $semesters = $programme->semesters()->orderBy('semester_number')->get();
        if ($semesters->isEmpty() || empty($levelIds)) {
            return;
        }

        $perLevel = max(1, (int) ceil($semesters->count() / count($levelIds)));
        foreach ($semesters as $index => $semester) {
            $levelIndex = min((int) floor($index / $perLevel), count($levelIds) - 1);
            if (! $semester->programme_level_id) {
                $semester->update(['programme_level_id' => $levelIds[$levelIndex]]);
            }
        }
    }


    public function semesters(Request $request)
    {
        $institutionId = $this->ensureInstitutionId($request);

        $query = ProgrammeSemester::query()
            ->with(['programme.department', 'programme.academicUnit'])
            ->whereHas('programme', fn ($q) => $q->where('institution_id', $institutionId));

        if ($request->filled('programme_id')) {
            $query->where('programme_id', $request->programme_id);
        }

        return response()->json($query->orderBy('programme_id')->orderBy('semester_number')->get());
    }

    public function storeSemester(Request $request)
    {
        $institutionId = $this->ensureInstitutionId($request);

        $validator = Validator::make($request->all(), [
            'programme_id' => ['required', 'integer', Rule::exists('programmes', 'id')->where(fn ($q) => $q->where('institution_id', $institutionId))],
            'semester_number' => [
                'required',
                'integer',
                'min:1',
                'max:20',
                Rule::unique('programme_semesters')->where(fn ($q) => $q->where('programme_id', $request->programme_id)),
            ],
            'name' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'academic_year' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $semester = ProgrammeSemester::create([
            'programme_id' => $request->programme_id,
            'semester_number' => $request->semester_number,
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'academic_year' => $request->academic_year,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($semester->load('programme'), 201);
    }

    public function organizationTree(Request $request)
    {
        $institutionId = $this->ensureInstitutionId($request);

        $institution = Institution::findOrFail($institutionId);

        $units = AcademicUnit::with([
            'departments.programmes.semesters',
            'departments.programmes.programSubjects.subject',
        ])->where('institution_id', $institutionId)->orderBy('name')->get();

        $unassignedDepartments = Department::with([
            'programmes.semesters',
            'programmes.programSubjects.subject',
        ])
            ->where('institution_id', $institutionId)
            ->whereNull('academic_unit_id')
            ->orderBy('name')
            ->get();

        $subjects = Subject::where('institution_id', $institutionId)->orderBy('name')->get();

        $programLinks = ProgramSubject::with(['programme.department', 'subject', 'semester'])
            ->where('institution_id', $institutionId)
            ->orderBy('programme_id')
            ->get();

        $departments = Department::with('academicUnit')
            ->where('institution_id', $institutionId)
            ->orderBy('name')
            ->get();

        $programmes = Programme::with(['department', 'academicUnit', 'semesters'])
            ->where('institution_id', $institutionId)
            ->orderBy('name')
            ->get();

        return response()->json([
            'institution' => ['id' => $institution->id, 'name' => $institution->name],
            'academic_units' => $units,
            'unassigned_departments' => $unassignedDepartments,
            'departments' => $departments,
            'programmes' => $programmes,
            'subjects' => $subjects,
            'program_links' => $programLinks,
        ]);
    }

    public function programSubjects(Request $request)
    {
        $institutionId = $this->ensureInstitutionId($request);

        $query = ProgramSubject::with(['programme', 'subject', 'semester'])
            ->where('institution_id', $institutionId);

        if ($request->filled('programme_id')) {
            $query->where('programme_id', $request->programme_id);
        }

        return response()->json($query->orderBy('programme_id')->get());
    }

    public function storeProgramSubject(Request $request)
    {
        $institutionId = $this->ensureInstitutionId($request);

        $validator = Validator::make($request->all(), [
            'programme_id' => ['required', Rule::exists('programmes', 'id')->where(fn ($q) => $q->where('institution_id', $institutionId))],
            'subject_id' => ['required', Rule::exists('subjects', 'id')->where(fn ($q) => $q->where('institution_id', $institutionId))],
            'programme_semester_id' => 'nullable|integer|exists:programme_semesters,id',
            'credit_hours_override' => 'nullable|numeric|min:0',
            'contact_hours_override' => 'nullable|integer|min:0',
            'is_required' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $link = ProgramSubject::create([
            'institution_id' => $institutionId,
            'programme_id' => $request->programme_id,
            'subject_id' => $request->subject_id,
            'programme_semester_id' => $request->programme_semester_id,
            'credit_hours_override' => $request->credit_hours_override,
            'contact_hours_override' => $request->contact_hours_override,
            'is_required' => $request->boolean('is_required', true),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json($link->load(['programme', 'subject', 'semester']), 201);
    }

    public function updateProgramSubject(Request $request, ProgramSubject $programSubject)
    {
        if ($programSubject->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $programSubject->update($request->only([
            'programme_semester_id', 'credit_hours_override', 'contact_hours_override', 'is_required', 'is_active',
        ]));

        return response()->json($programSubject->fresh(['programme', 'subject', 'semester']));
    }

    public function destroyProgramSubject(Request $request, ProgramSubject $programSubject)
    {
        if ($programSubject->institution_id !== $this->ensureInstitutionId($request)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $programSubject->delete();

        return response()->json(['message' => 'Link removed.']);
    }

    protected function syncRequiredDocuments(Programme $programme, array $documents): void
    {
        if (! Schema::hasTable('programme_required_documents')) {
            return;
        }

        $keptIds = [];

        foreach (array_values($documents) as $index => $document) {
            $name = trim((string) ($document['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            $payload = [
                'name' => $name,
                'description' => ! empty($document['description']) ? trim((string) $document['description']) : null,
                'is_required' => array_key_exists('is_required', $document)
                    ? (bool) $document['is_required']
                    : true,
                'sort_order' => isset($document['sort_order']) ? (int) $document['sort_order'] : $index,
            ];

            if (! empty($document['id'])) {
                $existing = ProgrammeRequiredDocument::where('programme_id', $programme->id)
                    ->where('id', $document['id'])
                    ->first();
                if ($existing) {
                    $existing->update($payload);
                    $keptIds[] = $existing->id;
                    continue;
                }
            }

            $created = ProgrammeRequiredDocument::create(array_merge($payload, [
                'programme_id' => $programme->id,
            ]));
            $keptIds[] = $created->id;
        }

        ProgrammeRequiredDocument::where('programme_id', $programme->id)
            ->whereNotIn('id', $keptIds)
            ->delete();
    }

    protected function syncProgrammeAgreement(Programme $programme, $agreement): void
    {
        if (! Schema::hasTable('admission_agreements')) {
            return;
        }

        $existing = AdmissionAgreement::where('programme_id', $programme->id)->first();
        $payload = is_array($agreement) ? $agreement : null;
        $content = trim((string) ($payload['content'] ?? ''));

        if ($content === '') {
            if ($existing) {
                $existing->delete();
            }

            return;
        }

        AdmissionAgreement::updateOrCreate(
            ['programme_id' => $programme->id],
            [
                'institution_id' => $programme->institution_id,
                'title' => trim((string) ($payload['title'] ?? 'Programme Application Agreement')) ?: 'Programme Application Agreement',
                'content' => $content,
                'is_required' => array_key_exists('is_required', $payload) ? (bool) $payload['is_required'] : true,
                'is_active' => true,
            ]
        );
    }
}
