<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\CourseRegistration;
use Illuminate\Http\Request;

class CourseRegistrationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Student registers for courses
     */
    public function register(Request $request)
    {
        try {
            $student = Student::where('user_id', auth()->id())->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student record not found.',
                ], 404);
            }

            $request->validate([
                'semester_id' => 'required|exists:semesters,id',
                'courses' => 'required|array|min:1',
                'courses.*' => 'exists:courses,id',
            ]);

            $registrations = [];

            foreach ($request->courses as $courseId) {
                // Check if already registered
                $existing = CourseRegistration::where('student_id', $student->id)
                    ->where('course_id', $courseId)
                    ->where('semester_id', $request->semester_id)
                    ->first();

                if ($existing) {
                    continue;
                }

                $registration = CourseRegistration::create([
                    'institution_id' => $student->institution_id,
                    'student_id' => $student->id,
                    'course_id' => $courseId,
                    'semester_id' => $request->semester_id,
                    'status' => 'registered',
                    'approved_by_hod' => false,
                ]);

                $registrations[] = $registration;
            }

            // Notify HOD for approval
            $this->notifyHODForApproval($student, $request->semester_id);

            return response()->json([
                'success' => true,
                'message' => 'Courses registered. Awaiting HOD approval.',
                'data' => $registrations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to register courses.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * HOD approves course registration
     */
    public function approveCourseRegistration($registrationId)
    {
        try {
            $registration = CourseRegistration::findOrFail($registrationId);

            // Check if user is HOD of the course's department
            $userDepartment = auth()->user()->departments()->first();
            $courseDepartment = $registration->course->department;

            if ($userDepartment->id !== $courseDepartment->id) {
                abort(403, 'You are not authorized to approve this registration.');
            }

            $registration->update([
                'approved_by_hod' => true,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'status' => 'completed',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Course registration approved.',
                'data' => $registration,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve registration.',
            ], 500);
        }
    }

    /**
     * Reject course registration
     */
    public function rejectCourseRegistration(Request $request, $registrationId)
    {
        try {
            $registration = CourseRegistration::findOrFail($registrationId);

            $registration->update([
                'status' => 'rejected',
                'rejection_reason' => $request->reason,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Course registration rejected.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject registration.',
            ], 500);
        }
    }

    protected function notifyHODForApproval($student, $semesterId)
    {
        // Notify all HODs in the student's programme's department
        // Implementation depends on your notification system
    }
}
