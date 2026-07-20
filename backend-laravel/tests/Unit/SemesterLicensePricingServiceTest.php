<?php

namespace Tests\Unit;

use App\Modules\Licensing\Models\InstitutionSemesterLicense;
use App\Modules\Licensing\Models\LicensePlan;
use App\Modules\Licensing\Services\SemesterLicensePricingService;
use PHPUnit\Framework\TestCase;

class SemesterLicensePricingServiceTest extends TestCase
{
    protected $pricing;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pricing = new SemesterLicensePricingService();
    }

    protected function plan(array $attrs = []): LicensePlan
    {
        $plan = new LicensePlan();
        $plan->forceFill(array_merge([
            'price_per_student' => 1000,
            'minimum_billable_students' => 50,
            'down_payment_type' => 'percentage',
            'down_payment_value' => 30,
            'minimum_down_payment' => 0,
        ], $attrs));

        return $plan;
    }

    public function test_estimate_uses_minimum_billable_students()
    {
        $result = $this->pricing->calculateEstimatedSemesterFee($this->plan(), 10);

        $this->assertSame(10, $result['estimated_students']);
        $this->assertSame(50, $result['billable_qty']);
        $this->assertSame('50000.00', $result['estimated_total']);
    }

    public function test_estimate_uses_actual_count_when_above_minimum()
    {
        $result = $this->pricing->calculateEstimatedSemesterFee($this->plan(), 80);

        $this->assertSame(80, $result['billable_qty']);
        $this->assertSame('80000.00', $result['estimated_total']);
    }

    public function test_down_payment_percentage()
    {
        $plan = $this->plan(['down_payment_type' => 'percentage', 'down_payment_value' => 25]);
        $down = $this->pricing->calculateRequiredDownPayment($plan, '80000.00');

        $this->assertSame('20000.00', $down);
    }

    public function test_down_payment_fixed_amount()
    {
        $plan = $this->plan(['down_payment_type' => 'fixed_amount', 'down_payment_value' => 15000]);
        $down = $this->pricing->calculateRequiredDownPayment($plan, '80000.00');

        $this->assertSame('15000.00', $down);
    }

    public function test_down_payment_respects_minimum()
    {
        $plan = $this->plan([
            'down_payment_type' => 'percentage',
            'down_payment_value' => 5,
            'minimum_down_payment' => 10000,
        ]);
        $down = $this->pricing->calculateRequiredDownPayment($plan, '80000.00');

        $this->assertSame('10000.00', $down);
    }

    public function test_down_payment_cannot_exceed_total()
    {
        $plan = $this->plan([
            'down_payment_type' => 'fixed_amount',
            'down_payment_value' => 999999,
        ]);
        $down = $this->pricing->calculateRequiredDownPayment($plan, '5000.00');

        $this->assertSame('5000.00', $down);
    }

    public function test_minimum_student_charge_down_payment()
    {
        $plan = $this->plan([
            'down_payment_type' => 'minimum_student_charge',
            'minimum_billable_students' => 40,
            'price_per_student' => 1000,
        ]);
        $down = $this->pricing->calculateRequiredDownPayment($plan, '100000.00');

        $this->assertSame('40000.00', $down);
    }

    public function test_locked_fee_matches_estimate_formula()
    {
        $locked = $this->pricing->calculateLockedSemesterFee($this->plan(), 120);

        $this->assertSame(120, $locked['locked_students']);
        $this->assertSame('120000.00', $locked['locked_total']);
    }

    public function test_outstanding_balance_uses_locked_total()
    {
        $license = new InstitutionSemesterLicense();
        $license->forceFill([
            'estimated_total' => 50000,
            'locked_total' => 80000,
            'amount_paid' => 30000,
        ]);

        $balance = $this->pricing->calculateOutstandingBalance($license);

        $this->assertSame('50000.00', $balance);
    }

    public function test_additional_student_charge_full_rate()
    {
        $charge = $this->pricing->calculateAdditionalStudentCharge($this->plan(['price_per_student' => 2500]), 3);

        $this->assertSame('7500.00', $charge);
    }

    public function test_student_credit_matches_full_rate_for_authorized_notes()
    {
        $credit = $this->pricing->calculateStudentCredit($this->plan(['price_per_student' => 1000]), 2);

        $this->assertSame('2000.00', $credit);
    }
}
