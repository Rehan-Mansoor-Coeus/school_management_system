<?php

namespace App\Modules\Licensing\Services;

use App\Modules\Licensing\Models\LicensePlan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LicensePlanService
{
    public function list(array $filters = [])
    {
        $query = LicensePlan::query()->with('modules')->orderBy('display_order')->orderBy('name');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['license_type'])) {
            $query->where('license_type', $filters['license_type']);
        }

        if (! empty($filters['active_only'])) {
            $query->active();
        }

        return $query->get();
    }

    public function find(int $id): LicensePlan
    {
        return LicensePlan::with('modules')->findOrFail($id);
    }

    public function create(array $data, ?int $userId = null): LicensePlan
    {
        $data['code'] = $this->normalizeCode($data['code'] ?? $data['name'] ?? 'plan');
        $data['created_by'] = $userId;
        $moduleIds = $data['module_ids'] ?? [];
        unset($data['module_ids']);

        return DB::transaction(function () use ($data, $moduleIds) {
            $plan = LicensePlan::create($data);
            if (! empty($moduleIds)) {
                $plan->modules()->sync($moduleIds);
            }

            return $plan->fresh('modules');
        });
    }

    public function update(LicensePlan $plan, array $data): LicensePlan
    {
        if (isset($data['code'])) {
            $data['code'] = $this->normalizeCode($data['code']);
        }

        $moduleIds = array_key_exists('module_ids', $data) ? $data['module_ids'] : null;
        unset($data['module_ids']);

        return DB::transaction(function () use ($plan, $data, $moduleIds) {
            $plan->update($data);
            if (is_array($moduleIds)) {
                $plan->modules()->sync($moduleIds);
            }

            return $plan->fresh('modules');
        });
    }

    public function duplicate(LicensePlan $plan, ?int $userId = null): LicensePlan
    {
        $copy = $plan->replicate(['code']);
        $copy->name = $plan->name.' (Copy)';
        $copy->code = $this->uniqueCode($plan->code.'-copy');
        $copy->status = 'draft';
        $copy->created_by = $userId;
        $copy->save();

        $copy->modules()->sync($plan->modules()->pluck('modules.id')->all());

        return $copy->fresh('modules');
    }

    public function setStatus(LicensePlan $plan, string $status): LicensePlan
    {
        $plan->update(['status' => $status]);

        return $plan->fresh('modules');
    }

    /**
     * Decimal-safe pricing preview for fixed/modular and per-student plans.
     * Frontend may show this; persisted totals always come from assign/update flows.
     */
    public function previewPricing(array $input): array
    {
        $currency = $input['currency'] ?? 'XAF';
        $licenseType = $input['license_type'] ?? 'fixed_plan';
        $basePrice = $this->money($input['base_price'] ?? 0);
        $setupFee = $this->money($input['setup_fee'] ?? 0);
        $moduleTotal = $this->money($input['module_total'] ?? 0);
        $discount = $this->money($input['discount_amount'] ?? 0);
        $tax = $this->money($input['tax_amount'] ?? 0);
        $negotiated = array_key_exists('custom_amount', $input) && $input['custom_amount'] !== null && $input['custom_amount'] !== ''
            ? $this->money($input['custom_amount'])
            : null;

        if ($licenseType === 'per_student_semester') {
            $pricePerStudent = $this->money($input['price_per_student'] ?? 0);
            $estimatedStudents = max(0, (int) ($input['estimated_students'] ?? 0));
            $minimumBillable = max(0, (int) ($input['minimum_billable_students'] ?? 0));
            $billableQty = max($estimatedStudents, $minimumBillable);
            $estimatedTotal = $this->mul($billableQty, $pricePerStudent);
            $downPayment = $this->calculateDownPayment(
                $estimatedTotal,
                $input['down_payment_type'] ?? null,
                $this->money($input['down_payment_value'] ?? 0),
                $this->money($input['minimum_down_payment'] ?? 0),
                $pricePerStudent,
                $minimumBillable
            );
            $balance = $this->sub($estimatedTotal, $downPayment);

            return [
                'currency' => $currency,
                'license_type' => $licenseType,
                'estimated_students' => $estimatedStudents,
                'minimum_billable_students' => $minimumBillable,
                'billable_qty' => $billableQty,
                'price_per_student' => $pricePerStudent,
                'estimated_total' => $estimatedTotal,
                'required_down_payment' => $downPayment,
                'estimated_balance' => $balance,
                'setup_fee' => $setupFee,
                'module_total' => $moduleTotal,
                'grand_total' => $this->add($estimatedTotal, $this->add($setupFee, $moduleTotal)),
                'note' => 'Per-student totals are estimates until semester lock (Phase 2b).',
            ];
        }

        $calculated = $this->add($basePrice, $this->add($setupFee, $moduleTotal));
        $subtotal = $negotiated !== null ? $negotiated : $calculated;
        $afterDiscount = max(0, $this->sub($subtotal, $discount));
        $total = $this->add($afterDiscount, $tax);

        return [
            'currency' => $currency,
            'license_type' => $licenseType,
            'base_price' => $basePrice,
            'setup_fee' => $setupFee,
            'module_total' => $moduleTotal,
            'calculated_amount' => $calculated,
            'custom_amount' => $negotiated,
            'discount_amount' => $discount,
            'tax_amount' => $tax,
            'total_amount' => $total,
            'note' => $negotiated !== null
                ? 'Using negotiated/custom amount override.'
                : 'Fixed/modular preview from plan base + setup + selected modules.',
        ];
    }

    protected function calculateDownPayment(
        $estimatedTotal,
        ?string $type,
        $value,
        $minimumDownPayment,
        $pricePerStudent,
        int $minimumBillable
    ) {
        $down = '0.00';
        switch ($type) {
            case 'percentage':
                $down = $this->mul($estimatedTotal, $this->div($value, '100'));
                break;
            case 'fixed_amount':
                $down = $value;
                break;
            case 'minimum_student_charge':
                $down = $this->mul(max($minimumBillable, 1), $pricePerStudent);
                break;
            case 'custom':
                $down = $value;
                break;
            default:
                $down = '0.00';
        }

        if ($this->cmp($minimumDownPayment, $down) > 0) {
            $down = $minimumDownPayment;
        }
        if ($this->cmp($down, $estimatedTotal) > 0) {
            $down = $estimatedTotal;
        }

        return $this->money($down);
    }

    protected function money($value): string
    {
        if (function_exists('bcadd')) {
            return bcadd((string) $value, '0', 2);
        }

        return number_format((float) $value, 2, '.', '');
    }

    protected function add($a, $b): string
    {
        if (function_exists('bcadd')) {
            return bcadd($this->money($a), $this->money($b), 2);
        }

        return $this->money((float) $a + (float) $b);
    }

    protected function sub($a, $b): string
    {
        if (function_exists('bcsub')) {
            return bcsub($this->money($a), $this->money($b), 2);
        }

        return $this->money((float) $a - (float) $b);
    }

    protected function mul($a, $b): string
    {
        if (function_exists('bcmul')) {
            return bcmul($this->money($a), $this->money($b), 2);
        }

        return $this->money((float) $a * (float) $b);
    }

    protected function div($a, $b): string
    {
        if (function_exists('bcdiv')) {
            return bcdiv($this->money($a), $this->money($b), 6);
        }

        $divisor = (float) $b;

        return $divisor == 0.0 ? '0.00' : $this->money((float) $a / $divisor);
    }

    protected function cmp($a, $b): int
    {
        if (function_exists('bccomp')) {
            return bccomp($this->money($a), $this->money($b), 2);
        }

        return (float) $a <=> (float) $b;
    }

    protected function normalizeCode(string $code): string
    {
        $normalized = Str::slug($code, '_');

        return $normalized !== '' ? $normalized : 'plan_'.Str::random(6);
    }

    protected function uniqueCode(string $base): string
    {
        $code = $this->normalizeCode($base);
        $candidate = $code;
        $i = 1;
        while (LicensePlan::withTrashed()->where('code', $candidate)->exists()) {
            $candidate = $code.'_'.$i;
            $i++;
        }

        return $candidate;
    }
}
