<?php

namespace App\Modules\Licensing\Services;

use App\AcademicYear;
use App\Institution;
use App\Modules\Licensing\Models\InstitutionSemesterLicense;
use App\Modules\Licensing\Models\LicensePlan;
use App\Modules\Licensing\Models\SemesterLicenseAdjustment;
use App\Modules\Licensing\Models\SemesterLicenseCountSnapshot;
use App\Modules\Licensing\Models\SemesterLicenseStudentUsage;
use App\Student;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SemesterLicenseService
{
    use MoneyMath;

    protected $pricing;

    public function __construct(SemesterLicensePricingService $pricing)
    {
        $this->pricing = $pricing;
    }

    protected function billing(): LicenseBillingService
    {
        return app(LicenseBillingService::class);
    }

    public function list(array $filters = [])
    {
        $query = InstitutionSemesterLicense::query()
            ->with(['plan', 'academicYear', 'institution'])
            ->orderByDesc('id');

        if (! empty($filters['institution_id'])) {
            $query->where('institution_id', $filters['institution_id']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('institution', function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')->orWhere('code', 'like', '%'.$search.'%');
            });
        }

        return $query->get();
    }

    public function createForSemester(Institution $institution, array $data, ?int $userId = null): InstitutionSemesterLicense
    {
        $plan = LicensePlan::findOrFail($data['license_plan_id']);
        if ($plan->license_type !== 'per_student_semester') {
            throw new \InvalidArgumentException('Only per_student_semester plans can be assigned to a semester.');
        }

        $year = AcademicYear::where('institution_id', $institution->id)->findOrFail($data['academic_year_id']);
        $semesterName = $data['semester_name'] ?? 'first';
        $estimated = array_key_exists('estimated_students', $data)
            ? (int) $data['estimated_students']
            : $this->countBillableStudents($institution, $plan);

        $fee = $this->pricing->calculateEstimatedSemesterFee($plan, $estimated);
        $down = $this->pricing->calculateRequiredDownPayment($plan, $fee['estimated_total']);

        return DB::transaction(function () use ($institution, $plan, $year, $semesterName, $fee, $down, $data, $userId) {
            $license = InstitutionSemesterLicense::updateOrCreate(
                [
                    'institution_id' => $institution->id,
                    'academic_year_id' => $year->id,
                    'semester_name' => $semesterName,
                ],
                [
                    'institution_license_id' => $data['institution_license_id'] ?? null,
                    'license_plan_id' => $plan->id,
                    'semester_id' => $data['semester_id'] ?? null,
                    'currency' => $plan->currency ?: 'XAF',
                    'price_per_student' => $fee['price_per_student'],
                    'minimum_billable_students' => $fee['minimum_billable_students'],
                    'estimated_students' => $fee['estimated_students'],
                    'projected_students' => $fee['estimated_students'],
                    'estimated_total' => $fee['estimated_total'],
                    'required_down_payment' => $down,
                    'balance_due' => $fee['estimated_total'],
                    'status' => 'awaiting_down_payment',
                    'payment_status' => 'unpaid',
                    'student_count_lock_date' => $data['student_count_lock_date'] ?? null,
                    'created_by' => $userId,
                    'notes' => $data['notes'] ?? null,
                ]
            );

            SemesterLicenseCountSnapshot::create([
                'institution_semester_license_id' => $license->id,
                'snapshot_type' => 'estimate',
                'student_count' => $fee['estimated_students'],
                'billable_count' => $fee['billable_qty'],
                'amount' => $fee['estimated_total'],
                'reason' => $data['estimate_reason'] ?? 'Initial estimate',
                'created_by' => $userId,
            ]);

            $this->syncUsageFromStudents($license, $plan);
            $invoice = $this->billing()->createDownPaymentInvoice($license, $userId);
            app(LicenseAuditService::class)->log([
                'institution_id' => $institution->id,
                'institution_semester_license_id' => $license->id,
                'license_plan_id' => $plan->id,
                'entity_type' => 'institution_semester_license',
                'entity_id' => $license->id,
                'action' => 'create',
                'reason' => $data['estimate_reason'] ?? 'Semester license created',
                'acted_by' => $userId,
            ]);
            app(LicenseNotificationService::class)->notifySemesterEvent($license, 'down_payment_invoice', [
                'Invoice' => optional($invoice)->invoice_number,
            ]);

            return $license->fresh(['plan', 'academicYear', 'institution']);
        });
    }

    public function countBillableStudents(Institution $institution, ?LicensePlan $plan = null): int
    {
        $query = Student::query()->where('institution_id', $institution->id);

        $excluded = ['withdrawn', 'graduated', 'deleted', 'inactive'];
        if ($plan && ! $plan->count_withdrawn_students) {
            // keep default exclude
        } else {
            $excluded = array_diff($excluded, ['withdrawn']);
        }
        if ($plan && ! $plan->count_graduated_students) {
            // keep
        } else {
            $excluded = array_diff($excluded, ['graduated']);
        }
        if ($plan && $plan->count_suspended_students) {
            // include suspended
        } else {
            $excluded[] = 'suspended';
        }

        $query->where(function ($q) use ($excluded) {
            $q->whereNull('status')->orWhereNotIn('status', array_values($excluded));
        });

        return (int) $query->count();
    }

    public function syncUsageFromStudents(InstitutionSemesterLicense $license, ?LicensePlan $plan = null): int
    {
        if (! Schema::hasTable('semester_license_student_usage') || ! Schema::hasTable('students')) {
            return 0;
        }

        $plan = $plan ?: $license->plan;
        $students = Student::query()
            ->where('institution_id', $license->institution_id)
            ->get(['id', 'user_id', 'status']);

        $locked = ! empty($license->locked_at);
        $count = 0;

        foreach ($students as $student) {
            $billable = $this->isStudentBillable($student->status, $plan);
            SemesterLicenseStudentUsage::updateOrCreate(
                [
                    'institution_semester_license_id' => $license->id,
                    'student_id' => $student->id,
                ],
                [
                    'user_id' => $student->user_id,
                    'status' => $student->status ?: 'active',
                    'is_billable' => $billable,
                    'added_after_lock' => $locked,
                    'first_seen_at' => now(),
                    'removed_at' => $billable ? null : now(),
                ]
            );
            if ($billable) {
                $count++;
            }
        }

        $license->update([
            'projected_students' => $count,
            'estimated_students' => $license->locked_at ? $license->estimated_students : $count,
        ]);

        if (! $license->locked_at && $plan) {
            $fee = $this->pricing->calculateEstimatedSemesterFee($plan, $count);
            $down = $this->pricing->calculateRequiredDownPayment($plan, $fee['estimated_total']);
            $license->update([
                'estimated_total' => $fee['estimated_total'],
                'required_down_payment' => $down,
                'balance_due' => $this->pricing->calculateOutstandingBalance($license->fresh()),
            ]);
        }

        return $count;
    }

    public function lockCount(InstitutionSemesterLicense $license, ?int $overrideCount, ?string $reason, ?int $userId): InstitutionSemesterLicense
    {
        if ($license->locked_at) {
            throw new \RuntimeException('Student count is already locked for this semester.');
        }

        $plan = $license->plan;
        $count = $overrideCount !== null ? $overrideCount : $this->syncUsageFromStudents($license, $plan);
        $locked = $this->pricing->calculateLockedSemesterFee($plan, $count);

        return DB::transaction(function () use ($license, $locked, $reason, $userId, $overrideCount) {
            $license->update([
                'locked_students' => $locked['locked_students'],
                'projected_students' => $locked['locked_students'],
                'locked_total' => $locked['locked_total'],
                'balance_due' => $this->sub($locked['locked_total'], $license->amount_paid),
                'status' => 'awaiting_reconciliation',
                'locked_at' => now(),
            ]);

            SemesterLicenseCountSnapshot::create([
                'institution_semester_license_id' => $license->id,
                'snapshot_type' => 'lock',
                'student_count' => $locked['locked_students'],
                'billable_count' => $locked['billable_qty'],
                'amount' => $locked['locked_total'],
                'reason' => $reason ?: ($overrideCount !== null ? 'Manual lock override' : 'Automatic lock'),
                'created_by' => $userId,
            ]);

            $invoice = $this->billing()->createBalanceInvoice($license->fresh(), $userId);
            app(LicenseAuditService::class)->log([
                'institution_id' => $license->institution_id,
                'institution_semester_license_id' => $license->id,
                'entity_type' => 'institution_semester_license',
                'entity_id' => $license->id,
                'action' => 'lock',
                'field' => 'locked_students',
                'new_value' => $locked['locked_students'],
                'reason' => $reason ?: 'Lock',
                'acted_by' => $userId,
            ]);
            if ($invoice) {
                app(LicenseNotificationService::class)->notifySemesterEvent($license->fresh(), 'final_balance', [
                    'Invoice' => $invoice->invoice_number,
                ]);
            }

            return $license->fresh(['plan', 'academicYear', 'institution']);
        });
    }

    public function reconcile(InstitutionSemesterLicense $license, ?int $userId = null): InstitutionSemesterLicense
    {
        $balance = $this->pricing->calculateOutstandingBalance($license);
        $status = $this->cmp($balance, '0') <= 0 ? 'paid' : 'balance_due';
        $paymentStatus = $status === 'paid' ? 'paid' : ($this->cmp($license->amount_paid, '0') > 0 ? 'partially_paid' : 'unpaid');
        $old = $license->status;

        $license->update([
            'balance_due' => $balance,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'reconciled_at' => now(),
        ]);

        SemesterLicenseCountSnapshot::create([
            'institution_semester_license_id' => $license->id,
            'snapshot_type' => 'reconciliation',
            'student_count' => (int) ($license->locked_students ?? $license->projected_students),
            'billable_count' => (int) ($license->locked_students ?? $license->projected_students),
            'amount' => $license->locked_total ?? $license->estimated_total,
            'reason' => 'Reconciliation',
            'created_by' => $userId,
        ]);

        app(LicenseAuditService::class)->log([
            'institution_id' => $license->institution_id,
            'institution_semester_license_id' => $license->id,
            'entity_type' => 'institution_semester_license',
            'entity_id' => $license->id,
            'action' => 'reconcile',
            'field' => 'status',
            'old_value' => $old,
            'new_value' => $status,
            'acted_by' => $userId,
        ]);

        $fresh = $license->fresh(['plan', 'academicYear']);
        if ($status === 'paid') {
            app(LicenseNotificationService::class)->notifySemesterEvent($fresh, 'fully_paid');
        }

        return $fresh;
    }

    public function applyPayment(InstitutionSemesterLicense $license, $amount, string $allocationType = 'down_payment'): InstitutionSemesterLicense
    {
        $paid = $this->add($license->amount_paid, $amount);
        $downPaid = $allocationType === 'down_payment'
            ? $this->add($license->down_payment_paid, $amount)
            : $this->money($license->down_payment_paid);

        $total = $license->locked_total !== null
            ? $this->money($license->locked_total)
            : $this->money($license->estimated_total);
        $balance = $this->money(max(0, (float) $this->sub($total, $paid)));

        $status = $license->status;
        $paymentStatus = 'partially_paid';

        if ($this->cmp($downPaid, $license->required_down_payment) >= 0
            && in_array($license->status, ['awaiting_down_payment', 'down_payment_partially_paid', 'down_payment_pending_verification'], true)) {
            $status = 'active';
            $paymentStatus = $this->cmp($balance, '0') <= 0 ? 'paid' : 'partially_paid';
        }

        if ($this->cmp($balance, '0') <= 0) {
            $status = 'paid';
            $paymentStatus = 'paid';
        } elseif ($this->cmp($downPaid, '0') > 0 && $this->cmp($downPaid, $license->required_down_payment) < 0) {
            $status = 'down_payment_partially_paid';
        }

        $oldStatus = $license->status;
        $license->update([
            'amount_paid' => $paid,
            'down_payment_paid' => $downPaid,
            'balance_due' => $balance,
            'status' => $status,
            'payment_status' => $paymentStatus,
        ]);

        $fresh = $license->fresh();
        if ($oldStatus !== $status && $status === 'active') {
            app(LicenseNotificationService::class)->notifySemesterEvent($fresh, 'activated');
        }
        if ($status === 'paid') {
            app(LicenseNotificationService::class)->notifySemesterEvent($fresh, 'fully_paid');
        }

        return $fresh;
    }

    public function recordAdditionalStudents(InstitutionSemesterLicense $license, int $quantity, ?string $reason, ?int $userId): InstitutionSemesterLicense
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be positive.');
        }
        if (! $license->locked_at) {
            throw new \RuntimeException('Additional student charges apply after lock.');
        }

        $charge = $this->pricing->calculateAdditionalStudentCharge($license->plan, $quantity);

        SemesterLicenseAdjustment::create([
            'institution_semester_license_id' => $license->id,
            'adjustment_type' => 'additional_student',
            'amount' => $charge,
            'quantity' => $quantity,
            'reason' => $reason ?: 'Additional students after lock',
            'created_by' => $userId,
        ]);

        $license->update([
            'locked_total' => $this->add($license->locked_total ?? $license->estimated_total, $charge),
            'balance_due' => $this->add($license->balance_due, $charge),
            'status' => 'balance_due',
            'payment_status' => 'partially_paid',
        ]);

        $this->billing()->createAdjustmentInvoice($license->fresh(), $charge, $quantity, $userId);
        $fresh = $license->fresh();
        app(LicenseAuditService::class)->log([
            'institution_id' => $license->institution_id,
            'institution_semester_license_id' => $license->id,
            'entity_type' => 'institution_semester_license',
            'entity_id' => $license->id,
            'action' => 'additional_students',
            'new_value' => $quantity,
            'reason' => $reason,
            'acted_by' => $userId,
        ]);
        app(LicenseNotificationService::class)->notifySemesterEvent($fresh, 'additional_charge', [
            'Quantity' => (string) $quantity,
            'Charge' => ($license->currency ?: 'XAF').' '.$charge,
        ]);

        return $fresh;
    }

    /**
     * Enrollment / student-create hook: refresh projected counts for open semester licenses.
     */
    public function syncOpenSemestersForInstitution(int $institutionId): void
    {
        if (! Schema::hasTable('institution_semester_licenses')) {
            return;
        }

        $open = InstitutionSemesterLicense::query()
            ->where('institution_id', $institutionId)
            ->whereNull('locked_at')
            ->whereIn('status', [
                'awaiting_down_payment', 'down_payment_partially_paid', 'down_payment_paid',
                'active', 'draft',
            ])
            ->get();

        foreach ($open as $license) {
            try {
                $this->syncUsageFromStudents($license);
            } catch (\Throwable $e) {
                // non-blocking for enrollment flows
            }
        }
    }

    protected function isStudentBillable(?string $status, ?LicensePlan $plan): bool
    {
        $status = strtolower((string) $status);
        if (in_array($status, ['deleted', 'inactive'], true)) {
            return false;
        }
        if ($status === 'suspended' && ! ($plan && $plan->count_suspended_students)) {
            return false;
        }
        if ($status === 'deferred' && ! ($plan && $plan->count_deferred_students)) {
            return false;
        }
        if ($status === 'withdrawn' && ! ($plan && $plan->count_withdrawn_students)) {
            return false;
        }
        if ($status === 'graduated' && ! ($plan && $plan->count_graduated_students)) {
            return false;
        }

        return true;
    }
}
