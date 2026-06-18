<?php

namespace App\Services\Messaging;

use App\Contracts\Messaging\WhatsAppMessagingProvider;

/**
 * Backward-compatible alias for existing announcement bindings.
 */
class WasenderWhatsAppService extends WhatsAppService implements WhatsAppMessagingProvider
{
    public function sendTemplateMessage(string $toPhone, array $contentVariables): array
    {
        $text = (string) ($contentVariables['message'] ?? $contentVariables['2'] ?? '');
        if ($text === '') {
            $text = 'Announcement';
        }

        return $this->sendTextMessage($toPhone, $text);
    }
}
