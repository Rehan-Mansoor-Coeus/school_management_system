<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Concerns\TranslatesForUser;
use App\Fee;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Resources\ApplicationResource;
use App\Modules\Admissions\Services\ApplicationProgressService;
use App\ProgrammeLevel;
use App\Services\Fees\FeeStatusService;
use App\Student;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StudentDashboardController extends Controller
{
    use TranslatesForUser;

    public function index()
    {
        $user = auth()->user();
        $applications = Application::whereHas('applicant', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with(['programme', 'academicYear', 'documents', 'applicant'])
            ->orderByDesc('created_at')
            ->get();

        $applications->each(function (Application $application) {
            $application->syncFeesFromProgramme();
        });

        if ($applications->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'total_applications' => 0,
                    'active_applications' => 0,
                    'enrolled_count' => 0,
                    'pending_fee_count' => 0,
                    'unread_notifications' => $this->unreadNotificationCount($user->id),
                    'latest_application' => null,
                    'applications_summary' => [],
                    'registration_fee_status' => ['status' => 'none', 'amount' => 0, 'paid' => false],
                    'tuition_fee_status' => ['status' => 'none', 'amount' => 0, 'paid' => false],
                    'enrollment' => null,
                ],
            ]);
        }

        $progressService = new ApplicationProgressService();
        $activeStatuses = ['submitted', 'registry_reviewed', 'department_approved', 'admitted', 'accepted', 'tuition_paid'];

        $latest = $applications->first();
        $latestPayload = (new ApplicationResource($latest))->resolve();
        $latestPayload['progress'] = $progressService->forApplication($latest);

        $summary = $applications->map(function (Application $app) use ($progressService) {
            return [
                'id' => $app->id,
                'application_number' => $app->application_number,
                'status' => $app->status,
                'programme' => $app->programme ? $app->programme->name : null,
                'academic_year' => $app->academicYear ? $app->academicYear->name : null,
                'registration_fee_paid' => (bool) $app->application_fee_paid,
                'application_fee_paid' => (bool) $app->application_fee_paid,
                'tuition_fee_paid' => (bool) $app->tuition_fee_paid,
                'progress_percent' => $progressService->forApplication($app)['percent'],
                'progress' => $progressService->forApplication($app),
            ];
        })->values();

        $studentRecord = Student::where('user_id', $user->id)->with('programme')->first();
        $enrollmentFees = $this->buildEnrollmentFeeSummary($studentRecord);

        return response()->json([
            'success' => true,
            'data' => [
                'total_applications' => $applications->count(),
                'active_applications' => $applications->whereIn('status', $activeStatuses)->count(),
                'enrolled_count' => $applications->where('status', 'enrolled')->count(),
                'pending_registration_fee_count' => $applications->filter(function (Application $app) {
                    return $app->status === 'submitted' && ! $app->application_fee_paid;
                })->count(),
                'pending_fee_count' => $applications->filter(function (Application $app) {
                    return $app->status === 'submitted' && ! $app->application_fee_paid;
                })->count(),
                'unread_notifications' => $this->unreadNotificationCount($user->id),
                'latest_application' => $latestPayload,
                'applications_summary' => $summary,
                'registration_fee_status' => $this->registrationFeeStatus($applications),
                'tuition_fee_status' => $this->tuitionFeeStatus($applications),
                'enrollment' => $enrollmentFees,
            ],
        ]);
    }

    protected function registrationFeeStatus($applications): array
    {
        $latest = $applications->first();
        if (! $latest) {
            return ['status' => 'none', 'amount' => 0, 'paid' => false];
        }

        return [
            'status' => $latest->application_fee_paid ? 'paid' : 'pending',
            'amount' => (float) $latest->application_fee,
            'paid' => (bool) $latest->application_fee_paid,
        ];
    }

    protected function tuitionFeeStatus($applications): array
    {
        $latest = $applications->first();
        if (! $latest) {
            return ['status' => 'none', 'amount' => 0, 'paid' => false];
        }

        return [
            'status' => $latest->tuition_fee_paid ? 'paid' : ($latest->status === 'accepted' ? 'due' : 'pending'),
            'amount' => (float) $latest->tuition_fee,
            'paid' => (bool) $latest->tuition_fee_paid,
        ];
    }

    protected function buildEnrollmentFeeSummary(?Student $student): ?array
    {
        if (! $student || ! Schema::hasTable('fees')) {
            return null;
        }

        $statusService = new FeeStatusService();
        $currentLevel = ProgrammeLevel::where('programme_id', $student->programme_id)
            ->where('level_number', $student->current_level)
            ->first();

        $fees = Fee::with(['programmeSemester', 'programmeLevel'])
            ->where('student_id', $student->id)
            ->orderBy('due_date')
            ->get();

        $currentFee = $fees->first(function (Fee $fee) use ($statusService) {
            $status = $statusService->calculate($fee);

            return in_array($status, ['pending', 'partial', 'due', 'overdue'], true);
        }) ?: $fees->last();

        if (! $currentFee) {
            return [
                'programme' => $student->programme ? ['id' => $student->programme->id, 'name' => $student->programme->name] : null,
                'current_level' => $student->current_level,
                'level' => $currentLevel ? ['id' => $currentLevel->id, 'name' => $currentLevel->name] : null,
                'semester' => null,
                'semester_fee' => 0,
                'amount_paid' => 0,
                'outstanding_balance' => 0,
                'expected_payment_date' => null,
                'latest_payment_date' => null,
                'payment_status' => 'none',
            ];
        }

        $paymentStatus = $statusService->calculate($currentFee);

        return [
            'programme' => $student->programme ? ['id' => $student->programme->id, 'name' => $student->programme->name] : null,
            'current_level' => $student->current_level,
            'level' => $currentFee->programmeLevel ? [
                'id' => $currentFee->programmeLevel->id,
                'name' => $currentFee->programmeLevel->name,
                'level_number' => $currentFee->programmeLevel->level_number,
            ] : ($currentLevel ? ['id' => $currentLevel->id, 'name' => $currentLevel->name] : null),
            'semester' => $currentFee->programmeSemester ? [
                'id' => $currentFee->programmeSemester->id,
                'name' => $currentFee->programmeSemester->name,
            ] : null,
            'semester_fee' => (float) $currentFee->total_amount,
            'amount_paid' => (float) $currentFee->amount_paid,
            'outstanding_balance' => (float) $currentFee->balance,
            'expected_payment_date' => optional($currentFee->due_date)->format('Y-m-d'),
            'latest_payment_date' => optional($currentFee->latest_payment_date)->format('Y-m-d'),
            'payment_status' => $paymentStatus,
            'fees' => $fees->map(function (Fee $fee) use ($statusService) {
                return [
                    'id' => $fee->id,
                    'semester_name' => $fee->semester_name ?: optional($fee->programmeSemester)->name,
                    'total_amount' => (float) $fee->total_amount,
                    'amount_paid' => (float) $fee->amount_paid,
                    'balance' => (float) $fee->balance,
                    'payment_status' => $statusService->calculate($fee),
                    'expected_payment_date' => optional($fee->due_date)->format('Y-m-d'),
                    'latest_payment_date' => optional($fee->latest_payment_date)->format('Y-m-d'),
                ];
            }),
        ];
    }

    protected function unreadNotificationCount($userId): int
    {
        if (! Schema::hasTable('app_notifications')) {
            return 0;
        }

        return (int) DB::table('app_notifications')
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }
}
