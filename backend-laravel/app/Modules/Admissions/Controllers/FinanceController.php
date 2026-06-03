<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Modules\Admissions\Concerns\TranslatesAdmissions;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Models\ApplicationPayment;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\Modules\Admissions\Services\NotificationService;
use App\Role;
use App\Student;
use App\User;
use Illuminate\Support\Str;

class FinanceController extends Controller
{
    use ResolvesInstitution, TranslatesAdmissions;

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
        $application = Application::with(['applicant', 'programme'])->findOrFail($applicationId);

        if ($application->status !== 'tuition_paid' || ! $application->tuition_fee_paid) {
            return response()->json([
                'success' => false,
                'message' => $this->admissionsTrans('tuition_not_paid'),
            ], 400);
        }

        $student = $this->createStudentFromApplication($application);
        $application->markTuitionVerified(auth()->id());

        (new NotificationService())->sendApplicationStatusNotification($application, 'enrolled');

        return response()->json([
            'success' => true,
            'message' => $this->admissionsTrans('tuition_verified'),
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
            return $existing;
        }

        $user = $applicant->user;
        if (! $user) {
            $user = User::create([
                'institution_id' => $application->institution_id,
                'name' => $applicant->full_name,
                'email' => $applicant->email,
                'phone_number' => $applicant->phone,
                'username' => Str::slug($applicant->first_name.'.'.$applicant->last_name).'.'.Str::random(4),
                'password' => bcrypt(Str::random(16)),
                'status' => 'active',
            ]);
            $applicant->update(['user_id' => $user->id]);
        }

        $studentRole = Role::where('name', 'student')->first();
        if ($studentRole && ! $user->hasRole('student')) {
            $user->assignRole($studentRole);
        }

        return Student::create([
            'institution_id' => $application->institution_id,
            'user_id' => $user->id,
            'applicant_id' => $applicant->id,
            'programme_id' => $application->programme_id,
            'registration_number' => $this->generateRegistrationNumber($application->institution_id),
            'status' => 'active',
            'admission_date' => now(),
            'current_level' => 100,
            'is_active' => true,
        ]);
    }

    protected function generateRegistrationNumber($institutionId)
    {
        $year = date('y');
        $count = Student::where('institution_id', $institutionId)
            ->whereYear('created_at', date('Y'))
            ->count() + 1;

        return 'REG'.$year.str_pad((string) $count, 5, '0', STR_PAD_LEFT);
    }
}
