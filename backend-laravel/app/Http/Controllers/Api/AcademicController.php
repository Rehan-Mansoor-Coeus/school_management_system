<?php

namespace App\Http\Controllers\Api;

use App\Department;
use App\Programme;
use App\ProgrammeSemester;
use App\ProgrammeSemesterSubject;
use App\Subject;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AcademicController extends Controller
{
    protected function getInstitutionId(Request $request)
    {
        return optional($request->user())->institution_id ?: $request->input('institution_id');
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

        $query = Programme::with(['department', 'semesters.assignments.subject'])
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

        return response()->json($programme->load(['department', 'semesters.assignments.subject']));
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
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $programme = Programme::create([
            'institution_id' => $institutionId,
            'department_id' => $request->department_id,
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'duration_years' => $request->duration_years,
            'level' => $request->level,
            'semester_count' => $request->semester_count,
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : true,
        ]);

        for ($index = 1; $index <= $programme->semester_count; $index++) {
            ProgrammeSemester::create([
                'programme_id' => $programme->id,
                'semester_number' => $index,
                'name' => "Semester {$index}",
            ]);
        }

        return response()->json($programme->load(['department', 'semesters.assignments.subject']), 201);
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
            'is_active' => 'nullable|boolean',
            'semesters' => 'nullable|array',
            'semesters.*.id' => 'required_with:semesters|integer|exists:programme_semesters,id',
            'semesters.*.name' => 'required_with:semesters|string|max:255',
            'semesters.*.is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $programme->update([
            'department_id' => $request->department_id,
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'duration_years' => $request->duration_years,
            'level' => $request->level,
            'semester_count' => $request->semester_count,
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

        return response()->json($programme->fresh()->load(['department', 'semesters.assignments.subject']));
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
            'description' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $subject->update([
            'name' => $request->name,
            'code' => $request->code,
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
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $semester->update([
            'name' => $request->name,
            'is_active' => $request->filled('is_active') ? (bool) $request->is_active : $semester->is_active,
        ]);

        return response()->json($semester);
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
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $assignment->update([
            'contact_hours' => $request->contact_hours,
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
}
