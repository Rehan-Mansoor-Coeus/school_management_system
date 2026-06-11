<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Models\ApplicationPayment;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\Modules\Admissions\Services\NotificationService;
use App\Institution;
use App\Role;
use App\Services\UserAccountNotificationService;
use App\Student;
use App\User;
use Illuminate\Support\Str;

class FinanceController extends Controller
{
    use ResolvesInstitution, TranslatesForUser;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:finance-officer|institution-admin|admin|super-admin');
    }

    public function pendingTuition()
    {
        $institutionId = $this->institutionId();

        $applications = Application::where('institution_id', $institutionId)
            ->where('status', 'tuition_paid')
            ->where('tuition_fee_paid', true)
            ->with(['applicant', 'programme'])
            ->orderByDesc('tuition_paid_at')
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
    }

    public function verifyTuition($applicationId)
    {
        $application = Application::with(['applicant', 'programme', 'institution'])->findOrFail($applicationId);

        if ($application->status !== 'tuition_paid' || ! $application->tuition_fee_paid) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.tuition_not_paid'),
            ], 400);
        }

        $result = $this->createStudentFromApplication($application);
        $student = $result['student'];
        $plainPassword = $result['plain_password'];
        $application->markTuitionVerified(auth()->id());

        $notificationService = new NotificationService();
        $user = $student->user;

        if ($plainPassword && $user) {
            (new UserAccountNotificationService())->notifyEnrollmentWithAccount(
                $user,
                $plainPassword,
                $student->registration_number
            );
        } else {
            $notificationService->sendApplicationStatusNotification($application, 'enrolled', [
                'reg' => $student->registration_number,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $this->transForUser('admissions.tuition_verified'),
            'data' => [
                'application' => new ApplicationResource($application->fresh()),
                'student' => $student,
            ],
        ]);
    }

    public function dashboard()
    {
        $institutionId = $this->institutionId();

        return response()->json([
            'success' => true,
            'data' => [
                'pending_verification' => Application::where('institution_id', $institutionId)
                    ->where('status', 'tuition_paid')
                    ->count(),
                'verified_today' => Application::where('institution_id', $institutionId)
                    ->where('status', 'enrolled')
                    ->whereDate('tuition_verified_at', today())
                    ->count(),
                'application_fees_collected' => ApplicationPayment::where('institution_id', $institutionId)
                    ->where('payment_type', 'application_fee')
                    ->where('status', 'completed')
                    ->sum('amount'),
                'tuition_collected' => ApplicationPayment::where('institution_id', $institutionId)
                    ->where('payment_type', 'tuition')
                    ->where('status', 'completed')
                    ->sum('amount'),
            ],
        ]);
    }

    protected function createStudentFromApplication(Application $application)
    {
        $applicant = $application->applicant;
        $existing = Student::where('applicant_id', $applicant->id)->first();
        if ($existing) {
            return ['student' => $existing->load('user'), 'plain_password' => null];
        }

        $plainPassword = null;
        $user = $applicant->user;
        if (! $user) {
            $plainPassword = UserAccountNotificationService::generateTemporaryPassword();
            $user = User::create([
                'institution_id' => $application->institution_id,
                'name' => $applicant->full_name,
                'email' => $applicant->email,
                'phone_number' => $applicant->phone,
                'username' => UserAccountNotificationService::generateUsername($applicant->full_name, $applicant->email),
                'password' => bcrypt($plainPassword),
                'api_token' => Str::random(60),
                'status' => 'active',
            ]);
            $applicant->update(['user_id' => $user->id]);
        }

        $studentRole = Role::where('name', 'student')->first();
        if ($studentRole && ! $user->hasRole('student')) {
            $user->assignRole($studentRole);
        }

        $student = Student::create([
            'institution_id' => $application->institution_id,
            'user_id' => $user->id,
            'applicant_id' => $applicant->id,
            'programme_id' => $application->programme_id,
            'registration_number' => $this->generateRegistrationNumber($application),
            'status' => 'active',
            'admission_date' => now(),
            'current_level' => 100,
            'is_active' => true,
        ]);

        return ['student' => $student->load('user'), 'plain_password' => $plainPassword];
    }

    protected function generateRegistrationNumber(Application $application)
    {
        $application->loadMissing(['applicant', 'programme', 'institution']);

        $institution = $application->institution ?: Institution::find($application->institution_id);
        $programme = $application->programme;
        $applicant = $application->applicant;

        $schoolCode = strtoupper(preg_replace('/[^A-Z0-9]/', '', (string) optional($institution)->code ?: 'SCH'));
        $programCode = strtoupper(preg_replace('/[^A-Z0-9]/', '', (string) optional($programme)->code ?: 'PRG'));

        $idNumber = preg_replace('/\s+/', '', (string) optional($applicant)->id_number);
        $idSuffix = strtoupper(substr($idNumber, -5));
        if (strlen($idSuffix) < 5) {
            $idSuffix = str_pad($idSuffix, 5, '0', STR_PAD_LEFT);
        }

        if ($schoolCode === '') {
            $schoolCode = 'SCH';
        }
        if ($programCode === '') {
            $programCode = 'PRG';
        }

        $base = $schoolCode.':'.$programCode.':'.$idSuffix;
        $candidate = $base;
        $counter = 1;

        while (Student::where('registration_number', $candidate)->exists()) {
            $candidate = $base.'-'.$counter;
            $counter++;
        }

        return $candidate;
    }
}
