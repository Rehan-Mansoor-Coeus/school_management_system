<?php

namespace App\Modules\Licensing\Services;

use App\Modules\Licensing\Models\BillingSetting;
use App\Modules\Licensing\Models\InstitutionSemesterLicense;
use App\Modules\Licensing\Models\LicenseInvoice;
use App\Modules\Licensing\Models\LicenseInvoiceItem;
use App\Modules\Licensing\Models\LicensePayment;
use App\Modules\Licensing\Models\LicensePaymentProof;
use App\Modules\Licensing\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class LicenseBillingService
{
    use MoneyMath;

    public function nextInvoiceNumber(): string
    {
        $settings = BillingSetting::current();
        $prefix = $settings->invoice_prefix ?: 'OKU-INV';
        $year = date('Y');
        $seq = LicenseInvoice::query()->whereYear('created_at', $year)->count() + 1;

        return sprintf('%s-%s-%06d', $prefix, $year, $seq);
    }

    public function createDownPaymentInvoice(InstitutionSemesterLicense $license, ?int $userId = null): LicenseInvoice
    {
        return $this->createInvoice($license, [
            'invoice_type' => 'down_payment',
            'description' => 'Semester license down payment ('.$license->semester_name.')',
            'item_type' => 'down_payment',
            'quantity' => 1,
            'unit_price' => $license->required_down_payment,
            'total' => $license->required_down_payment,
        ], $userId);
    }

    public function createBalanceInvoice(InstitutionSemesterLicense $license, ?int $userId = null): ?LicenseInvoice
    {
        $balance = app(SemesterLicensePricingService::class)->calculateOutstandingBalance($license);
        if ($this->cmp($balance, '0') <= 0) {
            return null;
        }

        return $this->createInvoice($license, [
            'invoice_type' => 'final_balance',
            'description' => 'Semester license balance after lock ('.$license->semester_name.')',
            'item_type' => 'final_balance',
            'quantity' => (int) ($license->locked_students ?? 0),
            'unit_price' => $license->price_per_student,
            'total' => $balance,
        ], $userId);
    }

    public function createAdjustmentInvoice(InstitutionSemesterLicense $license, $amount, int $quantity, ?int $userId = null): LicenseInvoice
    {
        return $this->createInvoice($license, [
            'invoice_type' => 'additional_student',
            'description' => 'Additional students after lock ('.$quantity.')',
            'item_type' => 'additional_student',
            'quantity' => $quantity,
            'unit_price' => $license->price_per_student,
            'total' => $amount,
        ], $userId);
    }

    protected function createInvoice(InstitutionSemesterLicense $license, array $meta, ?int $userId): LicenseInvoice
    {
        return DB::transaction(function () use ($license, $meta, $userId) {
            $invoice = LicenseInvoice::create([
                'institution_id' => $license->institution_id,
                'institution_license_id' => $license->institution_license_id,
                'institution_semester_license_id' => $license->id,
                'invoice_number' => $this->nextInvoiceNumber(),
                'invoice_type' => $meta['invoice_type'],
                'currency' => $license->currency ?: 'XAF',
                'subtotal' => $meta['total'],
                'total_amount' => $meta['total'],
                'status' => 'issued',
                'issue_date' => now()->toDateString(),
                'due_date' => now()->addDays((int) (BillingSetting::current()->default_payment_due_days ?? 14))->toDateString(),
                'created_by' => $userId,
            ]);

            LicenseInvoiceItem::create([
                'license_invoice_id' => $invoice->id,
                'item_type' => $meta['item_type'],
                'description' => $meta['description'],
                'quantity' => $meta['quantity'],
                'unit_price' => $meta['unit_price'],
                'line_total' => $meta['total'],
            ]);

            $fresh = $invoice->fresh(['items', 'institution']);
            app(LicenseNotificationService::class)->notifyInvoiceIssued($fresh);
            app(LicenseAuditService::class)->log([
                'institution_id' => $license->institution_id,
                'institution_semester_license_id' => $license->id,
                'entity_type' => 'license_invoice',
                'entity_id' => $fresh->id,
                'action' => 'create',
                'new_value' => $fresh->invoice_number,
                'acted_by' => $userId,
            ]);

            return $fresh;
        });
    }

    public function listInvoices(array $filters = [])
    {
        $query = LicenseInvoice::query()->with(['items', 'institution', 'semesterLicense'])->orderByDesc('id');
        if (! empty($filters['institution_id'])) {
            $query->where('institution_id', $filters['institution_id']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->get();
    }

    public function listPayments(array $filters = [])
    {
        $query = LicensePayment::query()->with(['proofs', 'institution', 'invoice'])->orderByDesc('id');
        if (! empty($filters['institution_id'])) {
            $query->where('institution_id', $filters['institution_id']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->get();
    }

    public function recordPayment(array $data, ?int $userId = null): LicensePayment
    {
        return DB::transaction(function () use ($data, $userId) {
            $payment = LicensePayment::create([
                'institution_id' => $data['institution_id'],
                'license_invoice_id' => $data['license_invoice_id'] ?? null,
                'institution_semester_license_id' => $data['institution_semester_license_id'] ?? null,
                'payment_number' => 'OKU-PAY-'.date('Y').'-'.str_pad((string) (LicensePayment::count() + 1), 6, '0', STR_PAD_LEFT),
                'currency' => $data['currency'] ?? 'XAF',
                'amount' => $data['amount'],
                'method' => $data['method'] ?? 'manual',
                'status' => ! empty($data['auto_verify']) ? 'verified' : 'pending',
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'recorded_by' => $userId,
                'verified_by' => ! empty($data['auto_verify']) ? $userId : null,
                'verified_at' => ! empty($data['auto_verify']) ? now() : null,
                'paid_at' => ! empty($data['auto_verify']) ? now() : null,
            ]);

            if (! empty($data['license_invoice_id']) || ! empty($data['institution_semester_license_id'])) {
                PaymentAllocation::create([
                    'license_payment_id' => $payment->id,
                    'license_invoice_id' => $data['license_invoice_id'] ?? null,
                    'institution_semester_license_id' => $data['institution_semester_license_id'] ?? null,
                    'allocation_type' => $data['allocation_type'] ?? 'down_payment',
                    'amount' => $data['amount'],
                ]);
            }

            if (! empty($data['auto_verify'])) {
                $this->applyVerifiedPayment($payment, $data['allocation_type'] ?? 'down_payment');
            }

            return $payment->fresh(['proofs', 'invoice', 'institution']);
        });
    }

    public function attachProof(LicensePayment $payment, $file, ?int $userId = null): LicensePaymentProof
    {
        $path = $file->store('license-payment-proofs', 'public');

        $payment->update(['status' => 'pending_verification']);

        $proof = LicensePaymentProof::create([
            'license_payment_id' => $payment->id,
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'status' => 'pending',
            'uploaded_by' => $userId,
        ]);

        if ($payment->institution_semester_license_id) {
            $sem = InstitutionSemesterLicense::find($payment->institution_semester_license_id);
            if ($sem) {
                app(LicenseNotificationService::class)->notifySemesterEvent($sem, 'proof_submitted');
            }
        }

        return $proof;
    }

    public function verifyPayment(LicensePayment $payment, bool $approve, ?string $reason, ?int $userId = null): LicensePayment
    {
        return DB::transaction(function () use ($payment, $approve, $reason, $userId) {
            if ($approve) {
                $payment->update([
                    'status' => 'verified',
                    'verified_by' => $userId,
                    'verified_at' => now(),
                    'paid_at' => $payment->paid_at ?: now(),
                ]);
                foreach ($payment->proofs as $proof) {
                    $proof->update([
                        'status' => 'approved',
                        'reviewed_by' => $userId,
                        'reviewed_at' => now(),
                    ]);
                }
                $allocationType = optional($payment->allocations()->first())->allocation_type ?: 'down_payment';
                $this->applyVerifiedPayment($payment, $allocationType);
            } else {
                $payment->update(['status' => 'rejected']);
                foreach ($payment->proofs as $proof) {
                    $proof->update([
                        'status' => 'rejected',
                        'rejection_reason' => $reason ?: 'Rejected by reviewer',
                        'reviewed_by' => $userId,
                        'reviewed_at' => now(),
                    ]);
                }
            }

            $fresh = $payment->fresh(['proofs', 'invoice', 'institution']);
            app(LicenseNotificationService::class)->notifyPaymentVerified($fresh, $approve);
            app(LicenseAuditService::class)->log([
                'institution_id' => $payment->institution_id,
                'institution_semester_license_id' => $payment->institution_semester_license_id,
                'entity_type' => 'license_payment',
                'entity_id' => $payment->id,
                'action' => $approve ? 'verify' : 'reject',
                'reason' => $reason,
                'acted_by' => $userId,
            ]);

            return $fresh;
        });
    }

    protected function applyVerifiedPayment(LicensePayment $payment, string $allocationType): void
    {
        if ($payment->license_invoice_id) {
            $invoice = LicenseInvoice::find($payment->license_invoice_id);
            if ($invoice) {
                $paid = $this->add($invoice->amount_paid, $payment->amount);
                $invoice->update([
                    'amount_paid' => $paid,
                    'status' => $this->cmp($paid, $invoice->total_amount) >= 0 ? 'paid' : 'partially_paid',
                    'paid_at' => $this->cmp($paid, $invoice->total_amount) >= 0 ? now() : null,
                ]);
            }
        }

        if ($payment->institution_semester_license_id) {
            $semester = InstitutionSemesterLicense::find($payment->institution_semester_license_id);
            if ($semester) {
                app(SemesterLicenseService::class)->applyPayment($semester, $payment->amount, $allocationType);
            }
        }
    }

    public function overviewKpis(): array
    {
        $semesters = Schema::hasTable('institution_semester_licenses')
            ? InstitutionSemesterLicense::query()->get()
            : collect();
        $invoices = Schema::hasTable('license_invoices') ? LicenseInvoice::query()->get() : collect();
        $payments = Schema::hasTable('license_payments') ? LicensePayment::query()->get() : collect();

        return [
            'semester_licenses' => $semesters->count(),
            'awaiting_down_payment' => $semesters->whereIn('status', ['awaiting_down_payment', 'down_payment_partially_paid'])->count(),
            'awaiting_lock' => $semesters->where('status', 'active')->whereNull('locked_at')->count(),
            'awaiting_reconciliation' => $semesters->where('status', 'awaiting_reconciliation')->count(),
            'estimated_revenue' => (float) $semesters->sum('estimated_total'),
            'locked_revenue' => (float) $semesters->sum(function ($row) {
                return $row->locked_total ?? 0;
            }),
            'down_payments_expected' => (float) $semesters->sum('required_down_payment'),
            'down_payments_received' => (float) $semesters->sum('down_payment_paid'),
            'outstanding_balances' => (float) $semesters->sum('balance_due'),
            'overdue_semesters' => $semesters->whereIn('status', ['overdue', 'suspended'])->count(),
            'invoices_issued' => $invoices->count(),
            'invoices_unpaid' => $invoices->whereIn('status', ['issued', 'partially_paid'])->count(),
            'payments_pending_verification' => $payments->whereIn('status', ['pending', 'pending_verification'])->count(),
        ];
    }
}
