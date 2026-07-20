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

    protected $formatter;

    public function __construct(WhatsAppService $whatsapp, LetterWorkflowService $workflow, MessageLogService $messageLogs)
    {
        $this->whatsapp = $whatsapp;
        $this->workflow = $workflow;
        $this->messageLogs = $messageLogs;
        $this->formatter = new NotificationMessageFormatter();
    }

    public function dispatch(Announcement $announcement, $institutionName = null): array
    {
        $announcement->loadMissing(['recipients', 'attachments']);
        $institutionName = $institutionName ?: 'Institution';

        $announcement->status = 'sending';
        $announcement->whatsapp_status = 'sending';
        $announcement->save();

        $mediaItems = $this->prepareMediaItems($announcement);

        $results = [
            'total' => $announcement->recipients->count(),
            'sent' => 0,
            'failed' => 0,
            'skipped' => 0,
            'failed_recipients' => [],
        ];

        $index = 0;
        foreach ($announcement->recipients as $recipient) {
            if ($index > 0) {
                sleep(6);
            }

            $outcome = $this->sendToRecipient($announcement, $recipient, $institutionName, $mediaItems);

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

            $index++;
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

    protected function prepareMediaItems(Announcement $announcement): array
    {
        $items = [];
        $paths = $announcement->attachments->map(function ($attachment) {
            return [
                'path' => $attachment->path,
                'mime' => $attachment->mime_type,
                'name' => $attachment->original_name,
            ];
        });

        if ($paths->isEmpty() && $announcement->attachment_path) {
            $paths = collect([[
                'path' => $announcement->attachment_path,
                'mime' => Storage::disk('public')->mimeType($announcement->attachment_path),
                'name' => basename($announcement->attachment_path),
            ]]);
        }

        foreach ($paths as $item) {
            $upload = $this->whatsapp->uploadLocalFile($item['path'], $item['mime']);
            if ($upload['success']) {
                $items[] = [
                    'url' => $upload['public_url'],
                    'mime' => $item['mime'],
                    'name' => $item['name'],
                    'path' => $item['path'],
                ];
            }
        }

        return $items;
    }

    protected function sendToRecipient(
        Announcement $announcement,
        AnnouncementRecipient $recipient,
        $institutionName,
        array $mediaItems = []
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

        if (empty($mediaItems)) {
            $response = $this->whatsapp->sendTextMessage($normalized, $messageBody);
        } else {
            $response = $this->sendWithMedia(
                $normalized,
                $messageBody,
                $mediaItems[0]['url'],
                $mediaItems[0]['mime'],
                $mediaItems[0]['name']
            );

            for ($i = 1; $i < count($mediaItems); $i++) {
                sleep(6);
                $extra = $this->sendWithMedia(
                    $normalized,
                    $mediaItems[$i]['name'],
                    $mediaItems[$i]['url'],
                    $mediaItems[$i]['mime'],
                    $mediaItems[$i]['name']
                );
                if (! $extra['success']) {
                    $response = $extra;
                    break;
                }
            }
        }

        $primaryPath = $mediaItems[0]['path'] ?? ($announcement->attachment_path ?: optional($announcement->attachments->first())->path);

        $this->logAttempt(
            $announcement,
            $recipient,
            $response['phone_number'] ?? $normalized,
            $messageBody,
            $primaryPath,
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
        $parts = [];

        if ($announcement->reference) {
            $parts[] = 'Ref: '.$announcement->reference;
        }

        $parts = array_merge($parts, array_filter([
            $this->personalize($announcement->header_html, $announcement, $recipient, $institutionName),
            $this->personalize($announcement->body_html, $announcement, $recipient, $institutionName),
            $this->personalize($announcement->footer_html, $announcement, $recipient, $institutionName),
        ]));

        $html = implode("\n\n", $parts);
        $text = trim(strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</div>'], "\n", $html)));
        $text = $text !== '' ? $text : ($announcement->title ?: 'Announcement');

        return $this->formatter->appendBrand($text, $institutionName);
    }

    protected function personalize($template, Announcement $announcement, AnnouncementRecipient $recipient, $institutionName = null): string
    {
        if (! $template) {
            return '';
        }

        return $this->workflow->personalize($template, [
            'name' => $recipient->name,
            'phone' => $recipient->phone,
            'phone_number' => $recipient->phone,
            'email' => $recipient->email,
            'address' => $recipient->address,
            'institution_name' => $institutionName,
            'reference' => $announcement->reference,
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
