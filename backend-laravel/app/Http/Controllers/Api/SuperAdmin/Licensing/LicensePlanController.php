<?php

namespace App\Http\Controllers\Api\SuperAdmin\Licensing;

use App\Http\Controllers\Controller;
use App\Modules\Licensing\Models\LicensePlan;
use App\Modules\Licensing\Services\LicensePlanService;
use App\Support\PlatformAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LicensePlanController extends Controller
{
    protected $plans;

    public function __construct(LicensePlanService $plans)
    {
        $this->plans = $plans;
        $this->middleware(function ($request, $next) {
            if (! PlatformAccess::isPlatformSuperAdmin($request->user())) {
                abort(403, 'Only platform super administrators can manage license plans.');
            }

            return $next($request);
        });
    }

    public function index(Request $request)
    {
        $plans = $this->plans->list([
            'status' => $request->get('status'),
            'license_type' => $request->get('license_type'),
            'active_only' => filter_var($request->get('active_only'), FILTER_VALIDATE_BOOLEAN),
        ]);

        return response()->json([
            'data' => $plans->map(function (LicensePlan $plan) {
                return $plan->toApiArray();
            })->values(),
        ]);
    }

    public function show($id)
    {
        $plan = $this->plans->find((int) $id);

        return response()->json(['data' => $plan->toApiArray()]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), $this->rules());
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $plan = $this->plans->create($validator->validated(), optional($request->user())->id);

        return response()->json([
            'message' => 'License plan created.',
            'data' => $plan->toApiArray(),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $plan = $this->plans->find((int) $id);
        $validator = Validator::make($request->all(), $this->rules($plan->id));
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $plan = $this->plans->update($plan, $validator->validated());

        return response()->json([
            'message' => 'License plan updated.',
            'data' => $plan->toApiArray(),
        ]);
    }

    public function duplicate(Request $request, $id)
    {
        $plan = $this->plans->find((int) $id);
        $copy = $this->plans->duplicate($plan, optional($request->user())->id);

        return response()->json([
            'message' => 'License plan duplicated.',
            'data' => $copy->toApiArray(),
        ], 201);
    }

    public function setStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,inactive,draft,archived',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $plan = $this->plans->setStatus($this->plans->find((int) $id), $request->status);

        return response()->json([
            'message' => 'Plan status updated.',
            'data' => $plan->toApiArray(),
        ]);
    }

    public function preview(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'license_type' => 'required|in:free,fixed_plan,modular,per_student_semester,usage_based,custom_contract',
            'currency' => 'nullable|string|max:10',
            'base_price' => 'nullable|numeric|min:0',
            'setup_fee' => 'nullable|numeric|min:0',
            'module_total' => 'nullable|numeric|min:0',
            'custom_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'price_per_student' => 'nullable|numeric|min:0',
            'estimated_students' => 'nullable|integer|min:0',
            'minimum_billable_students' => 'nullable|integer|min:0',
            'down_payment_type' => 'nullable|in:percentage,fixed_amount,minimum_student_charge,custom',
            'down_payment_value' => 'nullable|numeric|min:0',
            'minimum_down_payment' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return response()->json([
            'data' => $this->plans->previewPricing($validator->validated()),
        ]);
    }

    protected function rules(?int $ignoreId = null): array
    {
        $unique = 'unique:license_plans,code';
        if ($ignoreId) {
            $unique .= ','.$ignoreId;
        }

        return [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:80|'.$unique,
            'description' => 'nullable|string',
            'license_type' => 'required|in:free,fixed_plan,modular,per_student_semester,usage_based,custom_contract',
            'pricing_model' => 'nullable|string|max:40',
            'billing_cycle' => 'nullable|in:monthly,quarterly,six_months,yearly,one_time,custom',
            'currency' => 'nullable|string|max:10',
            'base_price' => 'nullable|numeric|min:0',
            'setup_fee' => 'nullable|numeric|min:0',
            'renewal_fee' => 'nullable|numeric|min:0',
            'late_fee' => 'nullable|numeric|min:0',
            'trial_days' => 'nullable|integer|min:0',
            'grace_period_days' => 'nullable|integer|min:0',
            'max_users' => 'nullable|integer|min:0',
            'max_students' => 'nullable|integer|min:0',
            'max_teachers' => 'nullable|integer|min:0',
            'max_staff' => 'nullable|integer|min:0',
            'max_admins' => 'nullable|integer|min:0',
            'max_storage' => 'nullable|integer|min:0',
            'price_per_student' => 'nullable|numeric|min:0',
            'student_billing_period' => 'nullable|string|max:40',
            'minimum_billable_students' => 'nullable|integer|min:0',
            'down_payment_type' => 'nullable|in:percentage,fixed_amount,minimum_student_charge,custom',
            'down_payment_value' => 'nullable|numeric|min:0',
            'minimum_down_payment' => 'nullable|numeric|min:0',
            'student_count_method' => 'nullable|string|max:80',
            'student_count_lock_rule' => 'nullable|string|max:80',
            'additional_student_rule' => 'nullable|string|max:80',
            'withdrawn_student_rule' => 'nullable|string|max:80',
            'balance_due_rule' => 'nullable|string|max:80',
            'activation_rule' => 'nullable|string|max:80',
            'count_suspended_students' => 'nullable|boolean',
            'count_deferred_students' => 'nullable|boolean',
            'count_withdrawn_students' => 'nullable|boolean',
            'count_graduated_students' => 'nullable|boolean',
            'status' => 'nullable|in:active,inactive,draft,archived',
            'is_featured' => 'nullable|boolean',
            'display_order' => 'nullable|integer|min:0',
            'module_ids' => 'nullable|array',
            'module_ids.*' => 'integer|exists:modules,id',
        ];
    }
}
