<?php

namespace App\Modules\Contracts\Services;

use App\Contracts\Messaging\WhatsAppMessagingProvider;
use App\Modules\Contracts\Models\Contract;
use App\Modules\Contracts\Models\ContractNotification;
use Illuminate\Support\Facades\Mail;

class ContractNotificationService
{
    protected $signingService;
    protected $whatsapp;

    public function __construct(ContractSigningService $signingService, WhatsAppMessagingProvider $whatsapp)
    {
        $this->signingService = $signingService;
        $this->whatsapp = $whatsapp;
    }

    public function sendSigningLink(Contract $contract, array $channels = ['email'], ?int $expiresDays = 14): array
    {
        $contract->loadMissing('signatories');
        $signatories = $contract->signatories->sortBy('sort_order')->values();
        $links = [];
        $results = [];

        if ($signatories->isEmpty()) {
            $tokenData = $this->signingService->createAccessToken($contract, $expiresDays);
            $links[] = ['role' => 'recipient', 'name' => $contract->recipient_name, 'url' => $tokenData['url']];
            $results['recipient'] = $this->dispatch($contract, $tokenData['url'], $channels, $contract->recipient_email, $contract->recipient_phone, $contract->recipient_name);
        } else {
            foreach ($signatories as $signatory) {
                $tokenData = $this->signingService->createAccessToken($contract, $expiresDays, false, $signatory->id);
                $email = $signatory->email ?: ($signatory->sort_order === 0 ? $contract->recipient_email : null);
                $phone = $signatory->phone ?: ($signatory->sort_order === 0 ? $contract->recipient_phone : null);
                $links[] = ['role' => $signatory->role, 'name' => $signatory->name, 'url' => $tokenData['url'], 'email' => $email, 'phone' => $phone];
                $results[$signatory->role] = $this->dispatch($contract, $tokenData['url'], $channels, $email, $phone, $signatory->name);
            }
        }

        app(ContractService::class)->transitionStatus($contract->fresh(), 'sent', auth()->id(), 'Document sent for signing');

        return ['links' => $links, 'results' => $results, 'token' => $links[0] ?? null];
    }

    protected function dispatch(Contract $contract, string $url, array $channels, ?string $email, ?string $phone, ?string $name): array
    {
        $out = [];
        foreach ($channels as $channel) {
            if ($channel === 'email' && $email) {
                $out['email'] = $this->sendEmail($contract, $url, $email, $name);
            }
            if ($channel === 'whatsapp' && $phone) {
                $out['whatsapp'] = $this->sendWhatsApp($contract, $url, $phone, $name);
            }
            if ($channel === 'internal') {
                $out['internal'] = $this->logInternal($contract, $url);
            }
        }

        return $out;
    }

    public function distributeExecutedCopies(Contract $contract): void
    {
        if (! $contract->executed_pdf_path) {
            return;
        }

        $message = 'Your signed contract '.$contract->reference_number.' is now fully executed. You can download your copy from the institution portal.';

        if ($contract->recipient_email) {
            $this->sendExecutedEmail($contract->recipient_email, $contract, $message);
        }
        if ($contract->recipient_phone) {
            $this->whatsapp->sendTextMessage($contract->recipient_phone, $message);
        }
    }

    protected function sendEmail(Contract $contract, string $url, string $email, ?string $name = null): bool
    {
        $name = $name ?: $contract->recipient_name;
        $subject = 'Document for Review & Signature — '.$contract->title;
        $body = "Dear {$name},\n\n"
            ."Please review and sign your document using the secure link below:\n\n"
            .$url."\n\n"
            ."Reference: {$contract->reference_number}\n\n"
            ."This link is confidential. Do not share it with others.\n";

        try {
            Mail::raw($body, function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            });

            ContractNotification::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'channel' => 'email',
                'recipient' => $email,
                'status' => 'sent',
                'message' => $body,
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Throwable $e) {
            ContractNotification::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'channel' => 'email',
                'recipient' => $email,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    protected function sendWhatsApp(Contract $contract, string $url, string $phone, ?string $name = null): bool
    {
        $name = $name ?: $contract->recipient_name;
        $message = "Dear {$name}, please review and sign your document ({$contract->reference_number}): {$url}";

        try {
            $result = $this->whatsapp->sendTextMessage($phone, $message);
            $ok = (bool) ($result['success'] ?? false);

            ContractNotification::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'channel' => 'whatsapp',
                'recipient' => $phone,
                'status' => $ok ? 'sent' : 'failed',
                'message' => $message,
                'sent_at' => $ok ? now() : null,
                'error_message' => $ok ? null : ($result['message'] ?? 'Failed'),
            ]);

            return $ok;
        } catch (\Throwable $e) {
            ContractNotification::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'channel' => 'whatsapp',
                'recipient' => $phone,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    protected function logInternal(Contract $contract, string $url): bool
    {
        ContractNotification::create([
            'institution_id' => $contract->institution_id,
            'contract_id' => $contract->id,
            'channel' => 'internal',
            'recipient' => (string) ($contract->user_id ?: $contract->recipient_email),
            'status' => 'sent',
            'message' => $url,
            'sent_at' => now(),
        ]);

        return true;
    }

    /**
     * Send an expiry/renewal reminder for a document about to expire.
     * The number of days remaining drives a unique marker used for de-duplication.
     */
    public function sendExpiryAlert(Contract $contract, int $daysLeft, array $channels = ['email', 'internal'], array $extraRecipients = [], ?int $threshold = null): array
    {
        $marker = 'expiry-'.($threshold ?? $daysLeft);
        $title = $contract->title ?: ('Document '.$contract->reference_number);
        $expiry = optional($contract->end_date)->format('d M Y');
        $subject = 'Document Expiry Reminder — '.$title;
        $body = "This is an automated reminder.\n\n"
            ."Document: {$title}\n"
            ."Reference: {$contract->reference_number}\n"
            ."Expires on: {$expiry}\n"
            ."Days remaining: {$daysLeft}\n\n"
            ."Please initiate renewal or any required action before the expiry date.";

        $out = [];

        // Build the recipient list (document recipient + any extra license-configured recipients).
        $emails = [];
        if (in_array('email', $channels, true)) {
            if ($contract->recipient_email) {
                $emails[] = $contract->recipient_email;
            }
            $emails = array_values(array_unique(array_merge($emails, $extraRecipients)));
        }

        foreach ($emails as $email) {
            $out['email'][$email] = $this->sendExpiryEmail($contract, $email, $subject, $body, $marker);
        }

        if (in_array('whatsapp', $channels, true) && $contract->recipient_phone) {
            $msg = "Reminder: document {$contract->reference_number} ({$title}) expires on {$expiry} — {$daysLeft} day(s) left. Please renew.";
            $out['whatsapp'] = $this->sendExpiryWhatsApp($contract, $contract->recipient_phone, $msg, $marker);
        }

        if (in_array('internal', $channels, true)) {
            ContractNotification::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'channel' => 'expiry_alert',
                'recipient' => (string) ($contract->user_id ?: $contract->recipient_email ?: 'internal'),
                'status' => 'sent',
                'message' => "[{$marker}] {$body}",
                'sent_at' => now(),
            ]);
            $out['internal'] = true;
        }

        return $out;
    }

    protected function sendExpiryEmail(Contract $contract, string $email, string $subject, string $body, string $marker): bool
    {
        try {
            Mail::raw($body, function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            });

            ContractNotification::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'channel' => 'expiry_alert',
                'recipient' => $email,
                'status' => 'sent',
                'message' => "[{$marker}] {$body}",
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Throwable $e) {
            ContractNotification::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'channel' => 'expiry_alert',
                'recipient' => $email,
                'status' => 'failed',
                'message' => "[{$marker}]",
                'error_message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    protected function sendExpiryWhatsApp(Contract $contract, string $phone, string $message, string $marker): bool
    {
        try {
            $result = $this->whatsapp->sendTextMessage($phone, $message);
            $ok = (bool) ($result['success'] ?? false);

            ContractNotification::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'channel' => 'expiry_alert',
                'recipient' => $phone,
                'status' => $ok ? 'sent' : 'failed',
                'message' => "[{$marker}] {$message}",
                'sent_at' => $ok ? now() : null,
                'error_message' => $ok ? null : ($result['message'] ?? 'Failed'),
            ]);

            return $ok;
        } catch (\Throwable $e) {
            ContractNotification::create([
                'institution_id' => $contract->institution_id,
                'contract_id' => $contract->id,
                'channel' => 'expiry_alert',
                'recipient' => $phone,
                'status' => 'failed',
                'message' => "[{$marker}]",
                'error_message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    protected function sendExecutedEmail(string $email, Contract $contract, string $body): void
    {
        try {
            Mail::raw($body, function ($message) use ($email, $contract) {
                $message->to($email)->subject('Executed Contract — '.$contract->reference_number);
            });
        } catch (\Throwable $e) {
            // Non-blocking
        }
    }
}
