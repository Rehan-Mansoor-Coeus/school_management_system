<?php

namespace App\Modules\Licensing\Services;

use App\AppNotification;
use App\Institution;
use App\Modules\Licensing\Models\InstitutionSemesterLicense;
use App\Modules\Licensing\Models\LicenseInvoice;
use App\Modules\Licensing\Models\LicensePayment;
use App\Services\Messaging\NotificationMessageFormatter;
use App\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class LicenseNotificationService
{
    protected $formatter;

    public function __construct()
    {
        $this->formatter = new NotificationMessageFormatter();
    }

    public function notifySemesterEvent(InstitutionSemesterLicense $license, string $event, array $extra = []): void
    {
        $institution = $license->institution ?: Institution::find($license->institution_id);
        $name = optional($institution)->name ?: 'Institution';
        $messages = [
            'down_payment_invoice' => ['Down payment invoice issued', 'A down-payment invoice was issued for '.$license->semester_name.'.'],
            'down_payment_due' => ['Down payment due', 'Please settle the required down payment to activate semester licensing.'],
            'proof_submitted' => ['Payment proof submitted', 'A payment proof was submitted and awaits platform verification.'],
            'proof_verified' => ['Payment verified', 'Your license payment was verified.'],
            'activated' => ['Semester license activated', 'Your semester license is now active.'],
            'lock_approaching' => ['Student count lock approaching', 'The billable student count will lock soon for '.$license->semester_name.'.'],
            'locked' => ['Student count locked', 'The semester student count has been locked. A balance invoice may follow.'],
            'final_balance' => ['Final balance due', 'The final semester balance is now due.'],
            'additional_charge' => ['Additional student charge', 'Additional students were billed after lock.'],
            'grace' => ['Grace period started', 'Your semester balance is overdue; a grace period applies.'],
            'overdue' => ['Semester balance overdue', 'Your semester license balance is overdue.'],
            'suspended' => ['Semester license suspended', 'Access is limited until outstanding balances are settled.'],
            'fully_paid' => ['Semester fully paid', 'Thank you. This semester license is fully paid.'],
            'renewal_request' => ['Renewal / upgrade requested', 'Your renewal or upgrade request was received by the platform.'],
        ];

        $pair = $messages[$event] ?? ['License update', 'There is an update to your institution license.'];
        $lines = [
            $this->formatter->field('Institution', $name),
            $this->formatter->field('Semester', (string) $license->semester_name),
            $this->formatter->field('Status', (string) $license->status),
            $this->formatter->field('Balance due', ($license->currency ?: 'XAF').' '.number_format((float) $license->balance_due, 2)),
        ];
        foreach ($extra as $label => $value) {
            $lines[] = $this->formatter->field((string) $label, (string) $value);
        }

        $body = $this->formatter->format($pair[0], null, array_merge([$pair[1]], $lines), $name);
        $this->notifyInstitutionAdmins((int) $license->institution_id, $pair[0], $body, 'licensing');
    }

    public function notifyInvoiceIssued(LicenseInvoice $invoice): void
    {
        $title = 'License invoice issued';
        $body = $this->formatter->format(
            $title,
            null,
            [
                $this->formatter->field('Invoice', $invoice->invoice_number),
                $this->formatter->field('Type', $invoice->invoice_type),
                $this->formatter->field('Amount', ($invoice->currency ?: 'XAF').' '.number_format((float) $invoice->total_amount, 2)),
                $this->formatter->field('Due', (string) optional($invoice->due_date)->toDateString()),
            ],
            optional($invoice->institution)->name
        );
        $this->notifyInstitutionAdmins((int) $invoice->institution_id, $title, $body, 'licensing');
    }

    public function notifyPaymentVerified(LicensePayment $payment, bool $approved): void
    {
        $title = $approved ? 'License payment verified' : 'License payment rejected';
        $body = $this->formatter->format(
            $title,
            null,
            [
                $this->formatter->field('Payment', $payment->payment_number),
                $this->formatter->field('Amount', ($payment->currency ?: 'XAF').' '.number_format((float) $payment->amount, 2)),
                $this->formatter->field('Status', $payment->status),
            ],
            optional($payment->institution)->name
        );
        $this->notifyInstitutionAdmins((int) $payment->institution_id, $title, $body, 'licensing');
    }

    public function notifyInstitutionLicenseExpiry(Institution $institution, string $status, ?string $expiryDate): void
    {
        $title = $status === 'expired' ? 'Institution license expired' : 'Institution license '.$status;
        $body = $this->formatter->format(
            $title,
            null,
            [
                $this->formatter->field('Institution', $institution->name),
                $this->formatter->field('Expiry', $expiryDate ?: '—'),
                'Contact the platform administrator to renew.',
            ],
            $institution->name
        );
        $this->notifyInstitutionAdmins((int) $institution->id, $title, $body, 'licensing');
    }

    protected function notifyInstitutionAdmins(int $institutionId, string $title, string $message, string $category): void
    {
        try {
            $users = User::query()
                ->where('institution_id', $institutionId)
                ->whereHas('roles', function ($q) {
                    $q->whereIn('name', ['institution-admin', 'admin', 'finance-officer']);
                })
                ->get();

            foreach ($users as $user) {
                AppNotification::create([
                    'user_id' => $user->id,
                    'institution_id' => $institutionId,
                    'title' => $title,
                    'message' => $message,
                    'type' => 'warning',
                    'category' => $category,
                    'link' => '/system/billing',
                    'is_read' => false,
                ]);

                if ($user->email) {
                    try {
                        Mail::raw($message, function ($mail) use ($user, $title) {
                            $mail->to($user->email)->subject('[Okusoma] '.$title);
                        });
                    } catch (\Throwable $e) {
                        Log::debug('licensing.email_failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
                    }
                }
            }

            Log::info('licensing.notification', [
                'institution_id' => $institutionId,
                'title' => $title,
                'recipients' => $users->count(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('licensing.notification_failed', ['error' => $e->getMessage()]);
        }
    }
}
