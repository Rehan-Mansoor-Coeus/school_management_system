<?php

namespace App\Contracts\Messaging;

interface WhatsAppMessagingProvider
{
    public function isConfigured(): bool;

    public function normalizePhoneNumber(string $phone): ?string;

    public function sendTemplateMessage(string $toPhone, array $contentVariables): array;
}
