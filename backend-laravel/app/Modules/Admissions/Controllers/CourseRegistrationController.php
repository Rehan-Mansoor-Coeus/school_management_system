<?php

namespace App\Modules\Admissions\Controllers;

use App\CourseRegistration;
use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Services\NotificationService;
use App\ProgrammeSemester;
use App\ProgrammeSemesterSubject;
use App\Student;
use App\Subject;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseRegistrationController extends Controller
{
    use ResolvesInstitution, TranslatesForUser;

    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function register(Request $request)
    {
        $student = Student::where('user_id', auth()->id())->first();

        if (! $student) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.courses_no_student'),
            ], 404);
        }

        $request->validate([
            'courses' => 'required|array|min:1',
            'courses.*' => [
                'integer',
                Rule::exists('subjects', 'id')->where(function ($query) use ($student) {
                    $query->where('institution_id', $student->institution_id);
                }),
            ],
            'programme_semester_id' => 'nullable|integer|exists:programme_semesters,id',
        ]);

        $registrations = [];

        foreach ($request->courses as $subjectId) {
            $existing = CourseRegistration::where('student_id', $student->id)
                ->where('subject_id', $subjectId)
                ->when($request->programme_semester_id, function ($query) use ($request) {
                    $query->where('programme_semester_id', $request->programme_semester_id);
                })
                ->first();

            if ($existing) {
                continue;
            }

            $registrations[] = CourseRegistration::create([
                'institution_id' => $student->institution_id,
                'student_id' => $student->id,
                'subject_id' => $subjectId,
                'programme_semester_id' => $request->programme_semester_id,
                'status' => 'registered',
                'approved_by_hod' => false,
            ]);
        }

        (new NotificationService())->notifyHodForCourseRegistration($student);

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.courses_registered'),
            'data' => $registrations,
        ]);
    }

    public function myRegistrations()
    {
        $student = Student::where('user_id', auth()->id())->first();
        if (! $student) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $registrations = CourseRegistration::where('student_id', $student->id)
            ->with(['subject:id,name,code', 'course:id,name,code'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $registrations]);
    }

    public function pendingHodApproval()
    {
        $institutionId = $this->institutionId();
        $user = auth()->user();

        $query = CourseRegistration::where('institution_id', $institutionId)
            ->where('approved_by_hod', false)
            ->where('status', 'registered')
            ->with(['student.user', 'student.programme', 'subject', 'course']);

        if ($user->department_id) {
            $query->whereHas('student.programme', function ($q) use ($user) {
                $q->where('department_id', $user->department_id);
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderByDesc('created_at')->paginate(20),
        ]);
    }

    public function approveCourseRegistration($registrationId)
    {
        $registration = CourseRegistration::with(['subject', 'course', 'student.programme'])->findOrFail($registrationId);
        $user = auth()->user();
        $departmentId = optional($registration->student->programme)->department_id;

        if ($user->department_id && (int) $departmentId !== (int) $user->department_id) {
            abort(403, $this->transForUser('admissions.hod_unauthorized'));
        }

        $registration->update([
            'approved_by_hod' => true,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'status' => 'completed',
        ]);

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.course_approved'),
            'data' => $registration,
        ]);
    }

    public function rejectCourseRegistration(Request $request, $registrationId)
    {
        $request->validate(['reason' => 'required|string|max:1000']);

        $registration = CourseRegistration::with(['subject', 'course', 'student.programme'])->findOrFail($registrationId);
        $user = auth()->user();
        $departmentId = optional($registration->student->programme)->department_id;

        if ($user->department_id && (int) $departmentId !== (int) $user->department_id) {
            abort(403, $this->transForUser('admissions.hod_unauthorized'));
        }

        $registration->update([
            'status' => 'rejected',
            'rejection_reason' => $request->reason,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.course_rejected'),
        ]);
    }

    public function availableCourses()
    {
        $student = Student::where('user_id', auth()->id())->with('programme')->first();

        if (! $student) {
            return response()->json([
                'success' => true,
                'data' => [],
                'reason' => 'no_student',
                'message' => $this->transForUser('admissions.courses_no_student'),
            ]);
        }

        $subjects = $this->subjectsForStudent($student);

        if ($subjects->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [],
                'reason' => 'no_subjects',
                'message' => $this->transForUser('admissions.courses_no_subjects'),
            ]);
        }

        return response()->json(['success' => true, 'data' => $subjects->values()]);
    }

    protected function subjectsForStudent(Student $student)
    {
        $items = collect();

        if ($student->programme_id) {
            $semesterIds = ProgrammeSemester::where('programme_id', $student->programme_id)
                ->where('is_active', true)
                ->pluck('id');

            if ($semesterIds->isNotEmpty()) {
                $assignments = ProgrammeSemesterSubject::whereIn('programme_semester_id', $semesterIds)
                    ->where('is_active', true)
                    ->with('subject')
                    ->get();

                foreach ($assignments as $assignment) {
                    $subject = $assignment->subject;
                    if (! $subject || ! $subject->is_active) {
                        continue;
                    }

                    $items->push([
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'code' => $subject->code,
                        'credit_units' => $assignment->contact_hours ?: $subject->default_contact_hours,
                        'programme_semester_id' => $assignment->programme_semester_id,
                    ]);
                }
            }
        }

        if ($items->isEmpty()) {
            $items = Subject::where('institution_id', $student->institution_id)
                ->where('is_active', true)
                ->orderBy('code')
                ->get()
                ->map(function (Subject $subject) {
                    return [
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'code' => $subject->code,
                        'credit_units' => $subject->default_contact_hours,
                        'programme_semester_id' => null,
                    ];
                });
        }

        return $items->unique('id')->values();
    }
}
