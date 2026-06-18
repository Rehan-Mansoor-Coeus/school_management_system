<?php

namespace App\Services\Messaging;

use App\MessageLog;
use App\WhatsappSetting;

class MessageLogService
{
    public function log(array $data): MessageLog
    {
        return MessageLog::create([
            'institution_id' => $data['institution_id'],
            'recipient_name' => $data['recipient_name'] ?? null,
            'phone_number' => $data['phone_number'] ?? null,
            'message_type' => $data['message_type'] ?? 'text',
            'module' => $data['module'] ?? null,
            'related_id' => $data['related_id'] ?? null,
            'message' => $data['message'] ?? null,
            'attachment_url' => $data['attachment_url'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'api_response' => $data['api_response'] ?? null,
            'error_message' => $data['error_message'] ?? null,
            'sent_at' => ($data['status'] ?? '') === 'sent' ? now() : null,
        ]);
    }

    public function logWhatsAppResult(
        int $institutionId,
        array $result,
        array $meta
    ): MessageLog {
        return $this->log([
            'institution_id' => $institutionId,
            'recipient_name' => $meta['recipient_name'] ?? null,
            'phone_number' => $result['phone_number'] ?? ($meta['phone_number'] ?? null),
            'message_type' => $meta['message_type'] ?? 'text',
            'module' => $meta['module'] ?? null,
            'related_id' => $meta['related_id'] ?? null,
            'message' => $meta['message'] ?? null,
            'attachment_url' => $meta['attachment_url'] ?? null,
            'status' => ($result['success'] ?? false) ? 'sent' : 'failed',
            'api_response' => $result['provider_response'] ?? null,
            'error_message' => $result['error'] ?? null,
        ]);
    }

    public function settingsForInstitution(int $institutionId): WhatsappSetting
    {
        return WhatsappSetting::firstOrCreate(
            ['institution_id' => $institutionId],
            [
                'enabled' => true,
                'provider' => 'wasenderapi',
                'otp_enabled' => false,
                'otp_expiry_seconds' => 180,
                'otp_resend_cooldown_seconds' => 60,
            ]
        );
    }
}
