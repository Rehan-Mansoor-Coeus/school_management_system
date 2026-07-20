<?php

namespace App\Http\Controllers\Api\SuperAdmin\Licensing;

use App\Http\Controllers\Controller;
use App\Institution;
use App\Modules\Licensing\Models\LicensePlan;
use App\Modules\Licensing\Services\InstitutionLicenseService;
use App\Modules\Licensing\Services\LicensePlanService;
use App\Services\InstitutionStatsService;
use App\Support\PlatformAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InstitutionLicenseController extends Controller
{
    protected $licenses;

    protected $stats;

    public function __construct(InstitutionLicenseService $licenses, InstitutionStatsService $stats)
    {
        $this->licenses = $licenses;
        $this->stats = $stats;
        $this->middleware(function ($request, $next) {
            if (! PlatformAccess::isPlatformSuperAdmin($request->user())) {
                abort(403, 'Only platform super administrators can manage institution licenses.');
            }

            return $next($request);
        });
    }

    public function index(Request $request)
    {
        $rows = $this->licenses->listInstitutionLicenses([
            'license_status' => $request->get('license_status'),
            'payment_status' => $request->get('payment_status'),
            'license_type' => $request->get('license_type'),
            'plan_id' => $request->get('plan_id'),
            'search' => $request->get('search'),
        ]);

        $data = $rows->map(function ($license) {
            $institution = $license->institution;
            $payload = $this->licenses->toCurrentLicensePayload($institution, $license);

            return array_merge($payload, [
                'institution' => [
                    'id' => $institution->id,
                    'name' => $institution->name,
                    'code' => $institution->code,
                    'is_active' => (bool) $institution->is_active,
                ],
            ]);
        })->values();

        return response()->json(['data' => $data]);
    }

    public function show(Institution $institution)
    {
        $license = $this->licenses->currentFor($institution);

        return response()->json([
            'institution' => $this->stats->institutionSummary($institution),
            'current_license' => $this->licenses->toCurrentLicensePayload($institution, $license),
            'stats' => $this->stats->forInstitution($institution)['stats'],
        ]);
    }

    /**
     * Multi-step assign/change license wizard endpoint.
     */
    public function assign(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'institution_id' => 'required|integer|exists:institutions,id',
            'license_plan_id' => 'required|integer|exists:license_plans,id',
            'billing_cycle' => 'nullable|string|max:40',
            'currency' => 'nullable|string|max:10',
            'start_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'license_status' => 'nullable|string|max:40',
            'payment_status' => 'nullable|string|max:40',
            'max_users_override' => 'nullable|integer|min:0',
            'max_students_override' => 'nullable|integer|min:0',
            'custom_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'module_ids' => 'nullable|array',
            'module_ids.*' => 'integer|exists:modules,id',
            'is_active' => 'nullable|boolean',
            'create_new_period' => 'nullable|boolean',
            'sync_plan_modules' => 'nullable|boolean',
            'notes' => 'nullable|string',
            'reason' => 'nullable|string|max:1000',
            'adjustment_amount' => 'nullable|numeric',
            'adjustment_reason' => 'nullable|string|max:1000',
            // Per-student semester assignment (Phase 2b)
            'academic_year_id' => 'nullable|integer|exists:academic_years,id',
            'semester_name' => 'nullable|string|max:40',
            'semester_id' => 'nullable|integer',
            'estimated_students' => 'nullable|integer|min:0',
            'student_count_lock_date' => 'nullable|date',
            'estimate_reason' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $institution = Institution::findOrFail($data['institution_id']);
        $plan = LicensePlan::with('modules')->findOrFail($data['license_plan_id']);

        if ($plan->license_type === 'per_student_semester') {
            if (empty($data['academic_year_id']) || empty($data['semester_name'])) {
                return response()->json([
                    'message' => 'Academic year and semester are required for per-student semester plans.',
                    'errors' => [
                        'academic_year_id' => ['Required for per_student_semester plans.'],
                        'semester_name' => ['Required for per_student_semester plans.'],
                    ],
                ], 422);
            }
        }

        $requiresUpfront = app(InstitutionLicenseService::class)->requiresUpfrontPayment($plan);
        $preview = app(LicensePlanService::class)->previewPricing([
            'license_type' => $plan->license_type,
            'currency' => $data['currency'] ?? $plan->currency,
            'base_price' => $plan->base_price,
            'setup_fee' => $plan->setup_fee,
            'price_per_student' => $plan->price_per_student,
            'minimum_billable_students' => $plan->minimum_billable_students,
            'down_payment_type' => $plan->down_payment_type,
            'down_payment_value' => $plan->down_payment_value,
            'minimum_down_payment' => $plan->minimum_down_payment,
            'custom_amount' => $data['custom_amount'] ?? null,
            'discount_amount' => $data['discount_amount'] ?? 0,
            'tax_amount' => $data['tax_amount'] ?? 0,
        ]);

        $defaultStatus = $requiresUpfront && (float) ($preview['total_amount'] ?? $preview['estimated_total'] ?? 0) > 0
            ? 'pending_payment'
            : 'active';
        $defaultPayment = $defaultStatus === 'pending_payment' ? 'unpaid' : 'paid';

        $payload = [
            'license_plan_id' => $plan->id,
            'billing_cycle' => $data['billing_cycle'] ?? $plan->billing_cycle,
            'currency' => $data['currency'] ?? $plan->currency,
            'start_date' => $data['start_date'] ?? now()->toDateString(),
            'expiry_date' => $data['expiry_date'] ?? null,
            'license_status' => $data['license_status'] ?? $defaultStatus,
            'payment_status' => $data['payment_status'] ?? $defaultPayment,
            'max_users_override' => $data['max_users_override'] ?? null,
            'max_students_override' => $data['max_students_override'] ?? null,
            'total_amount' => $data['total_amount'] ?? ($preview['total_amount'] ?? $preview['estimated_total'] ?? $plan->base_price),
            'amount_paid' => $data['amount_paid'] ?? ($defaultPayment === 'paid' ? ($data['total_amount'] ?? $preview['total_amount'] ?? 0) : 0),
            'module_ids' => $data['module_ids'] ?? $plan->modules->pluck('id')->all(),
            'sync_plan_modules' => empty($data['module_ids']),
            'create_new_period' => ! empty($data['create_new_period']),
            'is_active' => array_key_exists('is_active', $data) ? $data['is_active'] : true,
            'notes' => $data['notes'] ?? null,
            'reason' => $data['reason'] ?? 'Assigned via wizard',
        ];

        $license = $this->licenses->assignOrUpdate(
            $institution,
            $payload,
            optional($request->user())->id,
            $request->ip()
        );

        if (! empty($data['adjustment_amount']) && (float) $data['adjustment_amount'] != 0.0) {
            if (\Illuminate\Support\Facades\Schema::hasTable('license_adjustments')) {
                \App\Modules\Licensing\Models\LicenseAdjustment::create([
                    'institution_license_id' => $license->id,
                    'adjustment_type' => 'negotiated_override',
                    'amount' => (float) $data['adjustment_amount'],
                    'currency' => $license->currency ?: 'XAF',
                    'reason' => $data['adjustment_reason'] ?? 'Negotiated amount adjustment',
                    'created_by' => optional($request->user())->id,
                ]);
            }
        }

        $semesterLicense = null;
        if ($plan->license_type === 'per_student_semester'
            && \Illuminate\Support\Facades\Schema::hasTable('institution_semester_licenses')) {
            try {
                $semesterLicense = app(\App\Modules\Licensing\Services\SemesterLicenseService::class)->createForSemester(
                    $institution,
                    [
                        'license_plan_id' => $plan->id,
                        'institution_license_id' => $license->id,
                        'academic_year_id' => $data['academic_year_id'],
                        'semester_name' => $data['semester_name'],
                        'semester_id' => $data['semester_id'] ?? null,
                        'estimated_students' => $data['estimated_students'] ?? null,
                        'estimate_reason' => $data['estimate_reason'] ?? 'Assigned via wizard',
                        'student_count_lock_date' => $data['student_count_lock_date'] ?? null,
                        'notes' => $data['notes'] ?? null,
                    ],
                    optional($request->user())->id
                );
            } catch (\Throwable $e) {
                return response()->json([
                    'message' => 'Institution license saved, but semester license failed: '.$e->getMessage(),
                    'data' => $this->licenses->toCurrentLicensePayload($institution->fresh(), $license),
                    'preview' => $preview,
                ], 422);
            }
        }

        return response()->json([
            'message' => $semesterLicense
                ? 'License assigned and semester billing period created.'
                : 'License assigned successfully.',
            'data' => $this->licenses->toCurrentLicensePayload($institution->fresh(), $license),
            'semester_license' => $semesterLicense ? $semesterLicense->toApiArray() : null,
            'preview' => $preview,
            'school' => $this->stats->forInstitution($institution->fresh()),
        ], 201);
    }

    public function update(Request $request, Institution $institution)
    {
        $validator = Validator::make($request->all(), [
            'license_plan_id' => 'nullable|integer|exists:license_plans,id',
            'plan_code' => 'nullable|string|max:80',
            'billing_cycle' => 'nullable|string|max:40',
            'currency' => 'nullable|string|max:10',
            'start_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'next_billing_date' => 'nullable|date',
            'grace_period_end' => 'nullable|date',
            'license_status' => 'nullable|string|max:40',
            'payment_status' => 'nullable|string|max:40',
            'auto_renew' => 'nullable|boolean',
            'max_users_override' => 'nullable|integer|min:0',
            'max_students_override' => 'nullable|integer|min:0',
            'license_key' => 'nullable|string|max:100',
            'total_amount' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'module_ids' => 'nullable|array',
            'module_ids.*' => 'integer|exists:modules,id',
            'create_new_period' => 'nullable|boolean',
            'sync_plan_modules' => 'nullable|boolean',
            'reason' => 'nullable|string|max:1000',
            'notes' => 'nullable|string',
            // Legacy fields still accepted for compatibility
            'subscription_plan' => 'nullable|string|max:100',
            'subscription_status' => 'nullable|string|max:40',
            'subscription_expires_at' => 'nullable|date',
            'max_users' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (empty($data['license_plan_id']) && empty($data['plan_code']) && ! empty($data['subscription_plan'])) {
            $data['plan_code'] = $data['subscription_plan'];
        }
        if (empty($data['license_status']) && ! empty($data['subscription_status'])) {
            $data['license_status'] = $data['subscription_status'];
        }
        if (! array_key_exists('expiry_date', $data) && array_key_exists('subscription_expires_at', $data)) {
            $data['expiry_date'] = $data['subscription_expires_at'];
        }
        if (! array_key_exists('max_users_override', $data) && array_key_exists('max_users', $data)) {
            $data['max_users_override'] = $data['max_users'];
        }

        $license = $this->licenses->assignOrUpdate(
            $institution,
            $data,
            optional($request->user())->id,
            $request->ip()
        );

        return response()->json([
            'message' => 'Institution license updated.',
            'current_license' => $this->licenses->toCurrentLicensePayload($institution->fresh(), $license),
            'school' => $this->stats->forInstitution($institution->fresh()),
        ]);
    }
}
