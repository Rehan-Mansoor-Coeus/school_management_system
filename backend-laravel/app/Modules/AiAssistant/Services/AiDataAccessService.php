<?php

namespace App\Modules\AiAssistant\Services;

use App\Announcement;
use App\Fee;
use App\GeneralSetting;
use App\Institution;
use App\Library\LibraryBorrowRequest;
use App\Module;
use App\Modules\Admissions\Models\Application;
use App\Modules\Licensing\Models\InstitutionLicense;
use App\Modules\Licensing\Models\LicensePlan;
use App\Modules\Timetable\Models\CourseAssignment;
use App\Modules\Timetable\Models\TimetableEntry;
use App\Modules\Timetable\Services\StudentTimetableService;
use App\Services\Fees\FeeStatusService;
use App\Student;
use App\Support\AdminContext;
use Illuminate\Support\Facades\Schema;

class AiDataAccessService
{
    public function publicPricing()
    {
        $settings = GeneralSetting::current();
        $fee = (float) ($settings->per_student_license_fee ?: 0);
        $currency = $settings->per_student_license_currency ?: 'USD';
        $period = $settings->per_student_license_period ?: 'per_semester';
        $plans = [];
        if (Schema::hasTable('license_plans')) {
            $plans = LicensePlan::query()->active()->orderBy('display_order')->orderBy('name')->get()->map(function (LicensePlan $plan) {
                return [
                    'name' => $plan->name,
                    'code' => $plan->code,
                    'description' => $plan->description,
                    'currency' => $plan->currency,
                    'base_price' => $plan->base_price,
                    'setup_fee' => $plan->setup_fee,
                    'renewal_fee' => $plan->renewal_fee,
                    'price_per_student' => $plan->price_per_student,
                    'trial_days' => $plan->trial_days,
                    'billing_cycle' => $plan->billing_cycle,
                    'max_students' => $plan->max_students,
                ];
            })->all();
        }

        return [
            'per_student_license_fee' => $fee,
            'currency' => $currency,
            'period' => $period,
            'plans' => $plans,
        ];
    }

    public function publicModules()
    {
        return Module::query()->where('is_active', true)->orderBy('sort_order')->get(['key', 'name', 'description'])->toArray();
    }

    public function passwordResetInstructions()
    {
        return [
            'steps' => [
                'Open the Okusoma staff/admin login page at /admin.',
                'Select Forgot Password.',
                'Enter the email, username, or WhatsApp number connected to your account.',
                'Enter the OTP sent to WhatsApp, then set a new password.',
            ],
            'actions' => [
                ['label' => 'Reset Password', 'href' => '/admin'],
            ],
            'note' => 'Okusoma never asks for your current password in chat and never shows password hashes.',
        ];
    }

    public function studentProfile(AiRequestContext $ctx)
    {
        $student = $this->ownStudent($ctx);
        if (! $student) {
            return ['error' => 'No student record is linked to this account.'];
        }

        return [
            'registration_number' => $student->registration_number,
            'status' => $student->status,
            'current_level' => $student->current_level,
            'programme' => $student->programme ? $student->programme->name : null,
        ];
    }

    public function studentBalance(AiRequestContext $ctx)
    {
        $student = $this->ownStudent($ctx);
        if (! $student) {
            return ['error' => 'No student record is linked to this account.'];
        }

        $fees = Fee::where('student_id', $student->id)
            ->where('institution_id', $ctx->institutionId)
            ->get();
        $statusService = new FeeStatusService();
        $outstanding = 0;
        $paid = 0;
        $items = [];
        foreach ($fees as $fee) {
            $status = $statusService->calculate($fee);
            $outstanding += (float) $fee->balance;
            $paid += (float) $fee->amount_paid;
            $items[] = [
                'description' => $fee->description ?: ($fee->semester_name ?: 'Fee'),
                'balance' => (float) $fee->balance,
                'status' => $status,
            ];
        }

        $currency = optional(Institution::find($ctx->institutionId))->currency ?: 'XAF';

        return [
            'outstanding_balance' => $outstanding,
            'amount_paid' => $paid,
            'currency' => $currency,
            'items' => $items,
        ];
    }

    public function studentResults(AiRequestContext $ctx)
    {
        $student = $this->ownStudent($ctx);
        if (! $student) {
            return ['error' => 'No student record is linked to this account.'];
        }

        return [
            'cumulative_gpa' => $student->cumulative_gpa,
            'current_level' => $student->current_level,
            'note' => 'Published results appear on the student report. Ask your registrar if a grade is missing.',
        ];
    }

    public function studentCourses(AiRequestContext $ctx)
    {
        $student = $this->ownStudent($ctx);
        if (! $student) {
            return ['error' => 'No student record is linked to this account.'];
        }
        if (! method_exists($student, 'courseRegistrations')) {
            return ['courses' => []];
        }

        $rows = $student->courseRegistrations()->with('subject')->get();

        return [
            'courses' => $rows->map(function ($row) {
                return [
                    'name' => optional($row->subject)->name,
                    'status' => $row->status,
                ];
            })->all(),
        ];
    }

    public function studentTimetable(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        $service = app(StudentTimetableService::class);
        $data = $service->forUser((int) $ctx->institutionId, (int) $ctx->user->id);

        return [
            'student' => isset($data['student']) ? $data['student'] : null,
            'entries' => collect(isset($data['entries']) ? $data['entries'] : [])->map(function ($entry) {
                return [
                    'day' => $entry->day_of_week,
                    'start' => $entry->start_time,
                    'end' => $entry->end_time,
                    'course' => optional($entry->course)->name,
                    'classroom' => optional($entry->classroom)->name,
                ];
            })->all(),
        ];
    }

    public function libraryLoans(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        $rows = LibraryBorrowRequest::query()
            ->where('institution_id', $ctx->institutionId)
            ->where('user_id', $ctx->user->id)
            ->whereIn('status', ['issued', 'approved'])
            ->orderByDesc('id')
            ->limit(20)
            ->get();

        return [
            'loans' => $rows->map(function (LibraryBorrowRequest $row) {
                return [
                    'status' => $row->status,
                    'expected_return_date' => optional($row->expected_return_date)->toDateString(),
                ];
            })->all(),
        ];
    }

    public function applicationStatus(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        $apps = Application::query()
            ->where('institution_id', $ctx->institutionId)
            ->whereHas('applicant', function ($q) use ($ctx) {
                $q->where('user_id', $ctx->user->id);
            })
            ->orderByDesc('id')
            ->limit(10)
            ->get();

        return [
            'applications' => $apps->map(function (Application $app) {
                return [
                    'application_number' => $app->application_number,
                    'status' => $app->status,
                    'application_fee_paid' => (bool) $app->application_fee_paid,
                    'tuition_fee_paid' => (bool) $app->tuition_fee_paid,
                ];
            })->all(),
        ];
    }

    public function myAnnouncements(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        $rows = Announcement::query()
            ->where('institution_id', $ctx->institutionId)
            ->whereIn('status', ['sent', 'published'])
            ->orderByDesc('id')
            ->limit(5)
            ->get(['title', 'status', 'sent_at']);

        return ['announcements' => $rows->toArray()];
    }

    public function teacherCourses(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        $rows = CourseAssignment::query()
            ->with('course')
            ->where('institution_id', $ctx->institutionId)
            ->where('teacher_id', $ctx->user->id)
            ->where('is_active', true)
            ->get();

        return [
            'courses' => $rows->map(function (CourseAssignment $row) {
                return [
                    'course' => optional($row->course)->name,
                    'code' => optional($row->course)->code,
                    'academic_year' => $row->academic_year,
                ];
            })->all(),
        ];
    }

    public function teacherTimetable(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        $rows = TimetableEntry::query()
            ->with('course', 'classroom')
            ->where('institution_id', $ctx->institutionId)
            ->where('teacher_id', $ctx->user->id)
            ->whereIn('status', ['approved', 'published'])
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return [
            'entries' => $rows->map(function (TimetableEntry $entry) {
                return [
                    'day' => $entry->day_of_week,
                    'start' => $entry->start_time,
                    'end' => $entry->end_time,
                    'course' => optional($entry->course)->name,
                    'classroom' => optional($entry->classroom)->name,
                ];
            })->all(),
        ];
    }

    public function teacherEnrollmentCount(AiRequestContext $ctx)
    {
        $courses = $this->teacherCourses($ctx);

        return [
            'assigned_courses' => count($courses['courses']),
            'note' => 'Enrollment counts are limited to courses assigned to this teacher.',
        ];
    }

    public function financeSummary(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        $fees = Fee::where('institution_id', $ctx->institutionId)->get();
        $outstanding = 0;
        $collected = 0;
        foreach ($fees as $fee) {
            $outstanding += (float) $fee->balance;
            $collected += (float) $fee->amount_paid;
        }

        return [
            'total_outstanding' => $outstanding,
            'total_collected' => $collected,
            'invoice_count' => $fees->count(),
        ];
    }

    public function outstandingFees(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        $fees = Fee::with('student')
            ->where('institution_id', $ctx->institutionId)
            ->where('balance', '>', 0)
            ->orderByDesc('balance')
            ->limit(15)
            ->get();

        return [
            'students' => $fees->map(function (Fee $fee) {
                return [
                    'student' => optional($fee->student)->registration_number,
                    'balance' => (float) $fee->balance,
                ];
            })->all(),
        ];
    }

    public function institutionStudentCount(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);

        return [
            'active_students' => Student::where('institution_id', $ctx->institutionId)->where('is_active', true)->count(),
            'total_students' => Student::where('institution_id', $ctx->institutionId)->count(),
        ];
    }

    public function institutionModules(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        $institution = Institution::with(['modules' => function ($q) {
            $q->wherePivot('enabled', true);
        }])->find($ctx->institutionId);

        $modules = $institution ? $institution->modules->pluck('name') : collect();

        return ['enabled_modules' => $modules->values()->all()];
    }

    public function institutionLicense(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        $license = InstitutionLicense::query()
            ->with('plan')
            ->where('institution_id', $ctx->institutionId)
            ->current()
            ->first();
        $institution = Institution::find($ctx->institutionId);

        return [
            'license_status' => $license ? $license->license_status : ($institution ? $institution->subscription_status : null),
            'plan' => $license && $license->plan ? $license->plan->name : ($institution ? $institution->subscription_plan : null),
            'expires_at' => $license && $license->expiry_date
                ? $license->expiry_date->toDateString()
                : ($institution ? $institution->subscription_expires_at : null),
        ];
    }

    public function institutionSubscription(AiRequestContext $ctx)
    {
        return $this->institutionLicense($ctx);
    }

    public function platformLicenseOverview(AiRequestContext $ctx)
    {
        if (! AdminContext::isPlatformSuperAdmin($ctx->user)) {
            return ['error' => 'Not permitted.'];
        }

        return [
            'active_plans' => LicensePlan::query()->active()->count(),
            'current_licenses' => InstitutionLicense::query()->current()->count(),
        ];
    }

    protected function ownStudent(AiRequestContext $ctx)
    {
        $this->requireInstitution($ctx);
        if (! $ctx->user) {
            return null;
        }

        return Student::query()
            ->with('programme')
            ->where('user_id', $ctx->user->id)
            ->where('institution_id', $ctx->institutionId)
            ->first();
    }

    protected function requireInstitution(AiRequestContext $ctx)
    {
        if (! $ctx->user) {
            abort(response()->json(['message' => 'Sign in required.', 'code' => 'LOGIN_REQUIRED'], 401));
        }
        if (! $ctx->institutionId) {
            abort(response()->json([
                'message' => 'Institution context required.',
                'code' => 'INSTITUTION_CONTEXT_REQUIRED',
            ], 403));
        }
    }
}
