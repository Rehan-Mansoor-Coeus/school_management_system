<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Models\ApplicationPayment;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\Modules\Admissions\Services\EnrollmentService;
use App\Modules\Admissions\Services\NotificationService;
use App\Services\UserAccountNotificationService;

class FinanceController extends Controller
{
    use ResolvesInstitution, TranslatesForUser;

    protected $enrollmentService;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:finance-officer|institution-admin|admin|super-admin|system-super-admin');
        $this->enrollmentService = new EnrollmentService();
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

        $result = $this->enrollmentService->enrollFromApplication($application, auth()->id());
        $student = $result['student'];
        $plainPassword = $result['plain_password'];

        $notificationService = new NotificationService();
        $user = $student->user;

        if ($plainPassword && $user) {
            (new UserAccountNotificationService())->notifyEnrollmentWithAccount(
                $user,
                $plainPassword,
                $student->registration_number
            );
        } else {
            $notificationService->sendApplicationStatusNotification($application->fresh(), 'enrolled', [
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
}
