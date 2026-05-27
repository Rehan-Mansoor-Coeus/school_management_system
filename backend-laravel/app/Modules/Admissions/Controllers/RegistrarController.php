<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\Modules\Admissions\Services\AdmissionLetterService;
use App\Modules\Admissions\Services\NotificationService;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RegistrarController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:registrar|admin');
    }

    /**
     * Get applications ready for admission
     */
    public function readyForAdmission()
    {
        try {
            $institutionId = auth()->user()->institutions()->first()->id;

            $applications = Application::where('institution_id', $institutionId)
                ->where('status', 'approved')
                ->where('application_fee_paid', true)
                ->with(['applicant', 'programme'])
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => ApplicationResource::collection($applications),
                'pagination' => [
                    'total' => $applications->total(),
                    'per_page' => $applications->perPage(),
                    'current_page' => $applications->currentPage(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applications.',
            ], 500);
        }
    }

    /**
     * Admit student and generate admission letter
     */
    public function admit(Request $request, $applicationId)
    {
        try {
            $application = Application::findOrFail($applicationId);

            if (!$application->canAdmit()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application is not ready for admission.',
                ], 400);
            }

            // Create student record (if not exists)
            $student = $this->createStudentFromApplication($application);

            // Mark as admitted
            $application->admit(auth()->id());

            // Generate admission letter
            $letterService = new AdmissionLetterService();
            $letterPath = $letterService->generateAdmissionLetter($application);

            // Send notifications
            $notificationService = new NotificationService();
            $notificationService->sendAdmissionLetter($application, $letterPath);
            $notificationService->sendApplicationStatusNotification($application, 'admitted');

            return response()->json([
                'success' => true,
                'message' => 'Student admitted successfully. Admission letter sent.',
                'data' => [
                    'application' => new ApplicationResource($application),
                    'student' => $student,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to admit student.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create student account from application
     */
    protected function createStudentFromApplication(Application $application)
    {
        $applicant = $application->applicant;

        // Create or get user
        $user = $applicant->user ?? User::create([
            'institution_id' => $application->institution_id,
            'first_name' => $applicant->first_name,
            'last_name' => $applicant->last_name,
            'email' => $applicant->email,
            'phone' => $applicant->phone,
            'username' => Str::slug($applicant->first_name . '.' . $applicant->last_name) . '.' . Str::random(4),
            'password' => bcrypt(Str::random(16)),
            'is_active' => true,
        ]);

        // Create student record
        $student = Student::create([
            'institution_id' => $application->institution_id,
            'user_id' => $user->id,
            'applicant_id' => $applicant->id,
            'programme_id' => $application->programme_id,
            'registration_number' => $this->generateRegistrationNumber($application->institution_id),
            'status' => 'active',
            'admission_date' => now(),
            'current_level' => $application->programme->accreditation_number ? 100 : 200,
        ]);

        // Assign student role
        $studentRole = $application->institution->roles()->where('name', 'student')->first();
        if ($studentRole) {
            $user->roles()->attach($studentRole->id);
        }

        return $student;
    }

    /**
     * Generate registration number
     */
    protected function generateRegistrationNumber($institutionId)
    {
        $year = date('y');
        $count = Student::where('institution_id', $institutionId)
            ->whereYear('created_at', date('Y'))
            ->count() + 1;

        return 'STU' . $year . str_pad($count, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Get registrar dashboard
     */
    public function dashboard()
    {
        try {
            $institutionId = auth()->user()->institutions()->first()->id;

            $stats = [
                'ready_for_admission' => Application::where('institution_id', $institutionId)
                    ->where('status', 'approved')
                    ->where('application_fee_paid', true)
                    ->count(),
                'admitted' => Application::where('institution_id', $institutionId)
                    ->where('status', 'admitted')
                    ->count(),
                'enrolled' => Application::where('institution_id', $institutionId)
                    ->where('status', 'enrolled')
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data.',
            ], 500);
        }
    }
}
