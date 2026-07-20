<?php

namespace App\Modules\Licensing\Services;

use App\Modules\Licensing\Models\InstitutionSemesterLicense;
use App\Modules\Licensing\Models\LicensePlan;

class SemesterLicensePricingService
{
    use MoneyMath;

    public function calculateEstimatedSemesterFee(LicensePlan $plan, int $estimatedStudents): array
    {
        $price = $this->money($plan->price_per_student ?? 0);
        $minimum = max(0, (int) ($plan->minimum_billable_students ?? 0));
        $billable = max($estimatedStudents, $minimum);
        $total = $this->mul($billable, $price);

        return [
            'estimated_students' => $estimatedStudents,
            'minimum_billable_students' => $minimum,
            'billable_qty' => $billable,
            'price_per_student' => $price,
            'estimated_total' => $total,
        ];
    }

    public function calculateRequiredDownPayment(LicensePlan $plan, $estimatedTotal): string
    {
        $value = $this->money($plan->down_payment_value ?? 0);
        $minimum = $this->money($plan->minimum_down_payment ?? 0);
        $price = $this->money($plan->price_per_student ?? 0);
        $minStudents = max(0, (int) ($plan->minimum_billable_students ?? 0));
        $down = '0.00';

        switch ($plan->down_payment_type) {
            case 'percentage':
                $down = $this->mul($estimatedTotal, $this->div($value, '100'));
                break;
            case 'fixed_amount':
            case 'custom':
                $down = $value;
                break;
            case 'minimum_student_charge':
                $down = $this->mul(max($minStudents, 1), $price);
                break;
        }

        if ($this->cmp($minimum, $down) > 0) {
            $down = $minimum;
        }
        if ($this->cmp($down, $estimatedTotal) > 0) {
            $down = $this->money($estimatedTotal);
        }

        return $this->money($down);
    }

    public function calculateLockedSemesterFee(LicensePlan $plan, int $lockedStudents): array
    {
        $estimate = $this->calculateEstimatedSemesterFee($plan, $lockedStudents);

        return [
            'locked_students' => $lockedStudents,
            'billable_qty' => $estimate['billable_qty'],
            'locked_total' => $estimate['estimated_total'],
            'price_per_student' => $estimate['price_per_student'],
        ];
    }

    public function calculateOutstandingBalance(InstitutionSemesterLicense $license): string
    {
        $total = $license->locked_total !== null
            ? $this->money($license->locked_total)
            : $this->money($license->estimated_total);

        return $this->money(max(0, (float) $this->sub($total, $license->amount_paid)));
    }

    public function calculateAdditionalStudentCharge(LicensePlan $plan, int $quantity = 1): string
    {
        return $this->mul(max(0, $quantity), $this->money($plan->price_per_student ?? 0));
    }

    public function calculateStudentCredit(LicensePlan $plan, int $quantity = 1): string
    {
        // Credits are explicit only; default amount equals full rate for authorized credit notes.
        return $this->calculateAdditionalStudentCharge($plan, $quantity);
    }
}
