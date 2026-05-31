<?php

namespace App\Services\Messaging;

use App\Announcement;
use App\AnnouncementAttachment;
use App\AnnouncementLog;
use App\AnnouncementRecipient;
use App\Services\Letters\LetterWorkflowService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AnnouncementMessagingService
{
    protected $whatsapp;
    protected $workflow;
    protected $messageLogs;

    public function __construct(WhatsAppService $whatsapp, LetterWorkflowService $workflow, MessageLogService $messageLogs)
    {
        $this->whatsapp = $whatsapp;
        $this->workflow = $workflow;
        $this->messageLogs = $messageLogs;
    }

    public function dispatch(Announcement $announcement, $institutionName = null): array
    {
        $announcement->loadMissing(['recipients', 'attachments']);
        $institutionName = $institutionName ?: 'Institution';

        $announcement->status = 'sending';
        $announcement->whatsapp_status = 'sending';
        $announcement->save();

        $mediaUrl = null;
        $mediaMime = null;
        $mediaName = null;
        $attachment = $announcement->attachments->first();
        if ($attachment) {
            $upload = $this->whatsapp->uploadLocalFile($attachment->path, $attachment->mime_type);
            if ($upload['success']) {
                $mediaUrl = $upload['public_url'];
                $mediaMime = $attachment->mime_type;
                $mediaName = $attachment->original_name;
            }
        } elseif ($announcement->attachment_path) {
            $upload = $this->whatsapp->uploadLocalFile($announcement->attachment_path);
            if ($upload['success']) {
                $mediaUrl = $upload['public_url'];
                $mediaName = basename($announcement->attachment_path);
                $mediaMime = Storage::disk('public')->mimeType($announcement->attachment_path);
            }
        }

        $results = [
            'total' => $announcement->recipients->count(),
            'sent' => 0,
            'failed' => 0,
            'skipped' => 0,
            'failed_recipients' => [],
        ];

        foreach ($announcement->recipients as $recipient) {
            $outcome = $this->sendToRecipient($announcement, $recipient, $institutionName, $mediaUrl, $mediaMime, $mediaName);

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

        if ($results['total'] === 0) {
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

    protected function sendToRecipient(
        Announcement $announcement,
        AnnouncementRecipient $recipient,
        $institutionName,
        ?string $mediaUrl,
        ?string $mediaMime,
        ?string $mediaName
    ) {
        $phone = trim((string) $recipient->phone);
        $normalized = $this->whatsapp->normalizePhoneNumber($phone);

        if (! $normalized) {
            $error = $phone === '' ? 'Recipient has no phone number.' : 'Invalid phone number format.';
            $this->markFailed($announcement, $recipient, $phone, null, null, $error);

            return ['status' => 'failed', 'error' => $error];
        }

        $messageBody = $this->buildMessageBody($announcement, $recipient, $institutionName);
        $recipient->personalized_message = $messageBody;
        $recipient->save();

        if ($mediaUrl) {
            $response = $this->sendWithMedia($normalized, $messageBody, $mediaUrl, $mediaMime, $mediaName);
        } else {
            $response = $this->whatsapp->sendTextMessage($normalized, $messageBody);
        }

        $this->logAttempt(
            $announcement,
            $recipient,
            $response['phone_number'] ?? $normalized,
            $messageBody,
            $announcement->attachment_path ?: optional($announcement->attachments->first())->path,
            $response['success'] ? 'sent' : 'failed',
            $response['provider_response'] ?? null,
            $response['error'] ?? null
        );

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

    protected function sendWithMedia(string $to, string $text, string $mediaUrl, ?string $mime, ?string $fileName): array
    {
        $mime = strtolower((string) $mime);
        if (strpos($mime, 'image/') === 0) {
            return $this->whatsapp->sendImageMessage($to, $mediaUrl, $text);
        }

        return $this->whatsapp->sendDocumentMessage($to, $mediaUrl, $text, $fileName);
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
            'phone_number' => $recipient->phone,
            'email' => $recipient->email,
            'institution_name' => $institutionName,
            'date' => now()->format('M d, Y'),
        ]);
    }

    protected function markFailed(Announcement $announcement, AnnouncementRecipient $recipient, $phone, $message, $attachmentPath, $error)
    {
        $recipient->delivery_status = 'failed';
        $recipient->error_message = $error;
        $recipient->save();

        $this->logAttempt($announcement, $recipient, $phone ?: '—', $message, $attachmentPath, 'failed', null, $error);
    }

    protected function logAttempt(
        Announcement $announcement,
        AnnouncementRecipient $recipient,
        string $phone,
        ?string $message,
        ?string $attachmentPath,
        string $status,
        $providerResponse,
        $error = null
    ) {
        AnnouncementLog::create([
            'institution_id' => $announcement->institution_id,
            'announcement_id' => $announcement->id,
            'recipient_id' => $recipient->id,
            'provider' => 'wasenderapi',
            'phone_number' => $phone,
            'message' => $message ?: $announcement->title,
            'attachment_path' => $attachmentPath,
            'status' => $status,
            'provider_response' => $providerResponse,
            'error_message' => $error,
        ]);

        $this->messageLogs->log([
            'institution_id' => $announcement->institution_id,
            'recipient_name' => $recipient->name,
            'phone_number' => $phone,
            'message_type' => $attachmentPath ? 'document' : 'text',
            'module' => 'announcement',
            'related_id' => $announcement->id,
            'message' => $message ?: $announcement->title,
            'attachment_url' => $attachmentPath,
            'status' => $status,
            'api_response' => $providerResponse,
            'error_message' => $error,
        ]);
    }
}
