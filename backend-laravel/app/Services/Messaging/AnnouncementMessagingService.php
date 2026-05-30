<?php

namespace App\Services\Messaging;

use App\Announcement;
use App\AnnouncementLog;
use App\AnnouncementRecipient;
use App\Contracts\Messaging\WhatsAppMessagingProvider;
use App\Services\Letters\LetterWorkflowService;
use Illuminate\Support\Facades\Log;

class AnnouncementMessagingService
{
    protected $provider;
    protected $workflow;

    public function __construct(WhatsAppMessagingProvider $provider, LetterWorkflowService $workflow)
    {
        $this->provider = $provider;
        $this->workflow = $workflow;
    }

    public function dispatch(Announcement $announcement, $institutionName = null): array
    {
        $announcement->loadMissing('recipients');
        $institutionName = $institutionName ?: 'Institution';

        $results = [
            'sent' => 0,
            'failed' => 0,
            'skipped' => 0,
            'failed_recipients' => [],
        ];

        foreach ($announcement->recipients as $recipient) {
            $outcome = $this->sendToRecipient($announcement, $recipient, $institutionName);

            if ($outcome['status'] === 'sent') {
                $results['sent']++;
            } elseif ($outcome['status'] === 'failed') {
                $results['failed']++;
                $results['failed_recipients'][] = [
                    'name' => $recipient->name,
                    'phone' => $recipient->phone,
                    'error' => $outcome['error'],
                ];
            } else {
                $results['skipped']++;
                $results['failed_recipients'][] = [
                    'name' => $recipient->name,
                    'phone' => $recipient->phone,
                    'error' => $outcome['error'],
                ];
            }
        }

        $total = $results['sent'] + $results['failed'] + $results['skipped'];
        if ($total === 0) {
            $announcementStatus = 'failed';
            $whatsappStatus = 'failed';
        } elseif ($results['failed'] === 0 && $results['skipped'] === 0) {
            $announcementStatus = 'sent';
            $whatsappStatus = 'sent';
        } elseif ($results['sent'] === 0) {
            $announcementStatus = 'failed';
            $whatsappStatus = 'failed';
        } else {
            $announcementStatus = 'partial_failed';
            $whatsappStatus = 'partial_failed';
        }

        $announcement->status = $announcementStatus;
        $announcement->whatsapp_status = $whatsappStatus;
        if ($results['sent'] > 0) {
            $announcement->sent_at = now();
        }
        $announcement->save();

        return $results;
    }

    protected function sendToRecipient(Announcement $announcement, AnnouncementRecipient $recipient, $institutionName)
    {
        $phone = trim((string) $recipient->phone);
        $normalized = $this->provider->normalizePhoneNumber($phone);

        if (! $normalized) {
            $error = $phone === '' ? 'Recipient has no phone number.' : 'Invalid phone number format.';

            $recipient->delivery_status = 'failed';
            $recipient->error_message = $error;
            $recipient->save();

            $this->logAttempt($announcement, $recipient, $phone, 'failed', null, null, null, $error);

            return ['status' => 'failed', 'error' => $error];
        }

        $messageBody = $this->buildMessageBody($announcement, $recipient, $institutionName);
        $contentVariables = [
            '1' => $recipient->name ?: 'Recipient',
            '2' => $messageBody,
            '3' => $institutionName,
        ];

        $response = $this->provider->sendTemplateMessage($normalized, $contentVariables);

        AnnouncementLog::create([
            'institution_id' => $announcement->institution_id,
            'announcement_id' => $announcement->id,
            'recipient_id' => $recipient->id,
            'provider' => 'twilio',
            'phone_number' => $response['phone_number'] ?? $normalized,
            'message' => $messageBody,
            'content_sid' => $response['content_sid'] ?? null,
            'content_variables' => $response['content_variables'] ?? json_encode($contentVariables),
            'status' => $response['status'],
            'provider_response' => $response['provider_response'] ?? null,
            'error_message' => $response['error'] ?? null,
        ]);

        if ($response['success']) {
            $recipient->delivery_status = 'sent';
            $recipient->error_message = null;
            $recipient->sent_at = now();
            $recipient->save();

            return ['status' => 'sent', 'error' => null];
        }

        $recipient->delivery_status = 'failed';
        $recipient->error_message = $response['error'] ?? 'Send failed.';
        $recipient->save();

        Log::warning('Announcement WhatsApp delivery failed', [
            'announcement_id' => $announcement->id,
            'recipient_id' => $recipient->id,
            'error' => $response['error'] ?? null,
        ]);

        return ['status' => 'failed', 'error' => $response['error'] ?? 'Send failed.'];
    }

    protected function buildMessageBody(Announcement $announcement, AnnouncementRecipient $recipient, $institutionName): string
    {
        $parts = array_filter([
            $this->personalize($announcement->header_html, $recipient, $institutionName),
            $this->personalize($announcement->body_html, $recipient, $institutionName),
            $this->personalize($announcement->footer_html, $recipient, $institutionName),
        ]);

        $html = implode("\n\n", $parts);
        $text = trim(strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</div>'], "\n", $html)));

        return $text !== '' ? $text : ($announcement->title ?: 'Announcement');
    }

    protected function personalize($template, AnnouncementRecipient $recipient, $institutionName = null): string
    {
        if (! $template) {
            return '';
        }

        return $this->workflow->personalize($template, [
            'name' => $recipient->name,
            'phone' => $recipient->phone,
            'email' => $recipient->email,
            'institution_name' => $institutionName,
        ]);
    }

    protected function logAttempt(
        Announcement $announcement,
        AnnouncementRecipient $recipient,
        string $phone,
        string $status,
        $contentSid,
        $contentVariables,
        $providerResponse,
        $error = null
    ) {
        AnnouncementLog::create([
            'institution_id' => $announcement->institution_id,
            'announcement_id' => $announcement->id,
            'recipient_id' => $recipient->id,
            'provider' => 'twilio',
            'phone_number' => $phone ?: '—',
            'message' => $announcement->title,
            'content_sid' => $contentSid,
            'content_variables' => $contentVariables,
            'status' => $status,
            'provider_response' => $providerResponse,
            'error_message' => $error,
        ]);
    }
}
