<?php

namespace App\Jobs;

use App\Services\Messaging\WhatsAppService;
use App\Services\Messaging\MessageLogService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWhatsAppMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    protected $payload;
    protected $meta;

    public function __construct(array $payload, array $meta = [])
    {
        $this->payload = $payload;
        $this->meta = $meta;
    }

    public function handle(WhatsAppService $whatsapp, MessageLogService $messageLogs)
    {
        $type = $this->payload['type'] ?? 'text';

        if ($type === 'document') {
            $result = $whatsapp->sendDocumentMessage(
                $this->payload['to'],
                $this->payload['document_url'],
                $this->payload['text'] ?? null,
                $this->payload['file_name'] ?? null
            );
        } elseif ($type === 'image') {
            $result = $whatsapp->sendImageMessage(
                $this->payload['to'],
                $this->payload['image_url'],
                $this->payload['text'] ?? null
            );
        } else {
            $result = $whatsapp->sendTextMessage(
                $this->payload['to'],
                $this->payload['text'] ?? '',
                $this->meta['message_type'] ?? 'text'
            );
        }

        if (! empty($this->meta['institution_id'])) {
            $messageLogs->logWhatsAppResult((int) $this->meta['institution_id'], $result, $this->meta);
        }

        if (! ($result['success'] ?? false)) {
            throw new \RuntimeException($result['error'] ?? 'WhatsApp send failed.');
        }
    }
}
