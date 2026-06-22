<?php

namespace App\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Models\Course;
use App\Modules\Timetable\Services\CourseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CourseController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(CourseService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $items = $this->service->list($this->institutionId(), $request->only([
            'department_id', 'programme_id', 'programme_semester_id', 'active', 'search',
        ]));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show($id)
    {
        $course = Course::with(['department:id,name', 'programme:id,name,code', 'programmeSemester:id,name', 'subject:id,name,code'])
            ->where('institution_id', $this->institutionId())->findOrFail($id);

        return response()->json(['success' => true, 'data' => $course]);
    }

    public function store(Request $request)
    {
        try {
            $data = $this->validatePayload($request);
            $course = $this->service->create($this->institutionId(), (int) auth()->id(), $data);

            return response()->json(['success' => true, 'data' => $course], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Illuminate\Database\QueryException $e) {
            if ($this->isDuplicateCourseCode($e)) {
                return response()->json([
                    'success' => false,
                    'message' => 'A course with this code already exists for your institution. Use a different course code or edit the existing course.',
                    'errors' => ['code' => ['This course code is already in use.']],
                ], 422);
            }
            Log::error('Timetable course create failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function update(Request $request, $id)
    {
        $course = Course::where('institution_id', $this->institutionId())->findOrFail($id);
        try {
            $data = $this->validatePayload($request, false, (int) $id);
            $updated = $this->service->update($course, $data);

            return response()->json(['success' => true, 'data' => $updated]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Illuminate\Database\QueryException $e) {
            if ($this->isDuplicateCourseCode($e)) {
                return response()->json([
                    'success' => false,
                    'message' => 'A course with this code already exists for your institution.',
                    'errors' => ['code' => ['This course code is already in use.']],
                ], 422);
            }
            throw $e;
        }
    }

    public function destroy($id)
    {
        $course = Course::where('institution_id', $this->institutionId())->findOrFail($id);
        $this->service->delete($course);

        return response()->json(['success' => true, 'data' => ['deleted' => true]]);
    }

    protected function validatePayload(Request $request, bool $creating = true, ?int $courseId = null): array
    {
        $institutionId = $this->institutionId();

        return $request->validate([
            'code' => [
                $creating ? 'required' : 'sometimes',
                'string',
                'max:50',
                Rule::unique('tt_courses', 'code')
                    ->where('institution_id', $institutionId)
                    ->ignore($courseId),
            ],
            'name' => ($creating ? 'required' : 'sometimes').'|string|max:255',
            'subject_id' => 'nullable|integer',
            'department_id' => 'nullable|integer',
            'programme_id' => 'nullable|integer',
            'programme_semester_id' => 'nullable|integer',
            'semester_label' => 'nullable|string|max:100',
            'credit_hours' => 'nullable|numeric|min:0',
            'contact_hours' => 'nullable|integer|min:0',
            'practical_hours' => 'nullable|integer|min:0',
            'laboratory_hours' => 'nullable|integer|min:0',
            'level' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
        ]);
    }

    protected function isDuplicateCourseCode(\Illuminate\Database\QueryException $e): bool
    {
        $message = $e->getMessage();

        return str_contains($message, 'tt_courses_institution_id_code_unique')
            || str_contains($message, 'duplicate key value')
            || (string) $e->getCode() === '23505';
    }
}
