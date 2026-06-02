<?php

namespace App\Services\Letters;

use App\Institution;
use App\Jobs\SendLetterJob;
use App\Letter;
use App\LetterRecipient;
use App\MessageQueue;
use App\Services\Messaging\MessageLogService;
use App\Services\Messaging\WhatsAppService;

class LetterMessagingService
{
    protected $pdf;
    protected $whatsapp;
    protected $messageLogs;

    public function __construct(
        LetterPdfService $pdf,
        WhatsAppService $whatsapp,
        MessageLogService $messageLogs
    ) {
        $this->pdf = $pdf;
        $this->whatsapp = $whatsapp;
        $this->messageLogs = $messageLogs;
    }

    public function queueLetterDelivery(Letter $letter, ?int $senderId = null): array
    {
        $letter->loadMissing(['recipients', 'schedules']);
        $queued = 0;
        $scheduleTimes = $letter->schedules->pluck('scheduled_at')->filter();

        foreach ($letter->recipients as $recipient) {
            $times = $scheduleTimes->isNotEmpty() ? $scheduleTimes : collect([$letter->scheduled_at]);

            foreach ($times as $when) {
                $row = MessageQueue::create([
                    'institution_id' => $letter->institution_id,
                    'module' => 'letter',
                    'related_id' => $letter->id,
                    'recipient_id' => $recipient->id,
                    'payload' => [
                        'sender_id' => $senderId,
                    ],
                    'scheduled_at' => $when,
                    'status' => 'pending',
                ]);

                SendLetterJob::dispatch($row->id)->onQueue('whatsapp');
                $queued++;
            }
        }

        return ['queued' => $queued];
    }

    public function deliverQueuedRecipient(int $queueId): array
    {
        $queue = MessageQueue::find($queueId);
        if (! $queue || $queue->module !== 'letter') {
            return ['success' => false, 'error' => 'Queue item not found.'];
        }

        if ($queue->scheduled_at && $queue->scheduled_at->isFuture()) {
            return ['success' => false, 'error' => 'Not yet scheduled.'];
        }

        $queue->status = 'processing';
        $queue->attempts = (int) $queue->attempts + 1;
        $queue->save();

        $letter = Letter::with(['recipients', 'attachments'])->find($queue->related_id);
        $recipient = LetterRecipient::find($queue->recipient_id);

        if (! $letter || ! $recipient) {
            return $this->failQueue($queue, 'Letter or recipient not found.');
        }

        $phone = trim((string) $recipient->phone);
        $normalized = $this->whatsapp->normalizePhoneNumber($phone);
        if (! $normalized) {
            return $this->failQueue($queue, 'Invalid or missing phone number.', $letter, $recipient);
        }

        $institution = Institution::find($letter->institution_id);
        $pdfPath = $this->pdf->generateForRecipient($letter, $recipient, optional($institution)->name);

        $upload = $this->whatsapp->uploadLocalFile($pdfPath, 'application/pdf');
        $documentUrl = $upload['public_url'] ?? $this->whatsapp->publicUrlForStoragePath($pdfPath);

        if (! $documentUrl) {
            return $this->failQueue($queue, $upload['error'] ?? 'Unable to prepare PDF attachment.', $letter, $recipient, $pdfPath);
        }

        $caption = trim($letter->reference.': '.$letter->subject);
        $result = $this->whatsapp->sendDocumentMessage(
            $normalized,
            $documentUrl,
            $caption,
            basename($pdfPath)
        );

        $this->messageLogs->logWhatsAppResult($letter->institution_id, $result, [
            'recipient_name' => $recipient->name,
            'phone_number' => $normalized,
            'message_type' => 'document',
            'module' => 'letter',
            'related_id' => $letter->id,
            'message' => $caption,
            'attachment_url' => $documentUrl,
        ]);

        if ($result['success'] ?? false) {
            $attachmentError = $this->sendLetterAttachments($letter, $normalized);
            if ($attachmentError) {
                return $this->failQueue($queue, $attachmentError, $letter, $recipient, $pdfPath);
            }

            $recipient->delivery_status = 'sent';
            $recipient->save();
            $queue->status = 'sent';
            $queue->last_error = null;
            $queue->save();

            return ['success' => true];
        }

        return $this->failQueue($queue, $result['error'] ?? 'Send failed.', $letter, $recipient, $pdfPath);
    }

    protected function sendLetterAttachments(Letter $letter, string $normalizedPhone): ?string
    {
        $attachments = $letter->attachments ?? collect();
        if ($attachments->isEmpty()) {
            return null;
        }

        foreach ($attachments as $index => $attachment) {
            if ($index > 0) {
                sleep(6);
            }

            $upload = $this->whatsapp->uploadLocalFile($attachment->path, $attachment->mime_type);
            $mediaUrl = $upload['public_url'] ?? $this->whatsapp->publicUrlForStoragePath($attachment->path);

            if (! $mediaUrl) {
                return $upload['error'] ?? 'Unable to prepare attachment for WhatsApp.';
            }

            $mime = strtolower((string) $attachment->mime_type);
            if (strpos($mime, 'image/') === 0) {
                $result = $this->whatsapp->sendImageMessage($normalizedPhone, $mediaUrl, $attachment->original_name);
            } else {
                $result = $this->whatsapp->sendDocumentMessage(
                    $normalizedPhone,
                    $mediaUrl,
                    $attachment->original_name,
                    $attachment->original_name
                );
            }

            $this->messageLogs->logWhatsAppResult($letter->institution_id, $result, [
                'recipient_name' => null,
                'phone_number' => $normalizedPhone,
                'message_type' => strpos($mime, 'image/') === 0 ? 'image' : 'document',
                'module' => 'letter',
                'related_id' => $letter->id,
                'message' => $attachment->original_name,
                'attachment_url' => $mediaUrl,
            ]);

            if (! ($result['success'] ?? false)) {
                return $result['error'] ?? 'Failed to send letter attachment.';
            }
        }

        return null;
    }

    protected function failQueue(
        MessageQueue $queue,
        string $error,
        Letter $letter = null,
        LetterRecipient $recipient = null,
        ?string $pdfPath = null
    ): array {
        $queue->status = 'failed';
        $queue->last_error = $error;
        $queue->save();

        if ($recipient) {
            $recipient->delivery_status = 'failed';
            $recipient->save();
        }

        if ($letter && $recipient) {
            $this->messageLogs->log([
                'institution_id' => $letter->institution_id,
                'recipient_name' => $recipient->name,
                'phone_number' => $recipient->phone,
                'message_type' => 'document',
                'module' => 'letter',
                'related_id' => $letter->id,
                'message' => $letter->subject,
                'attachment_url' => $pdfPath ? $this->whatsapp->publicUrlForStoragePath($pdfPath) : null,
                'status' => 'failed',
                'error_message' => $error,
            ]);
        }

        return ['success' => false, 'error' => $error];
    }
}
