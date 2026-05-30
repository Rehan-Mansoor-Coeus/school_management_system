<?php

namespace App\Services\Messaging;

use App\Contracts\Messaging\WhatsAppMessagingProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioWhatsAppService implements WhatsAppMessagingProvider
{
    protected $accountSid;
    protected $authToken;
    protected $fromNumber;
    protected $contentSid;

    public function __construct()
    {
        $this->accountSid = config('services.twilio.account_sid');
        $this->authToken = config('services.twilio.auth_token');
        $this->fromNumber = config('services.twilio.whatsapp_from') ?: config('services.twilio.phone_number');
        $this->contentSid = config('services.twilio.announcement_content_sid');
    }

    public function isConfigured(): bool
    {
        return ! empty($this->accountSid)
            && ! empty($this->authToken)
            && ! empty($this->fromNumber)
            && ! empty($this->contentSid);
    }

    public function normalizePhoneNumber(string $phone): ?string
    {
        $phone = trim($phone);
        if ($phone === '') {
            return null;
        }

        $clean = preg_replace('/[\s\-().]/', '', $phone);
        if ($clean === '') {
            return null;
        }

        if (strpos($clean, '+') === 0) {
            $normalized = $clean;
        } elseif (ctype_digit($clean)) {
            $normalized = '+'.$clean;
        } else {
            return null;
        }

        $digitsOnly = preg_replace('/\D/', '', $normalized);
        if (strlen($digitsOnly) < 8 || strlen($digitsOnly) > 15) {
            return null;
        }

        return $normalized;
    }

    public function sendTemplateMessage(string $toPhone, array $contentVariables): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'status' => 'failed',
                'error' => 'Twilio WhatsApp is not configured. Set TWILIO_* values in .env.',
                'provider_response' => null,
                'content_sid' => $this->contentSid,
                'content_variables' => json_encode($contentVariables),
            ];
        }

        $normalized = $this->normalizePhoneNumber($toPhone);
        if (! $normalized) {
            return [
                'success' => false,
                'status' => 'failed',
                'error' => 'Invalid or missing phone number.',
                'provider_response' => null,
                'content_sid' => $this->contentSid,
                'content_variables' => json_encode($contentVariables),
            ];
        }

        $from = $this->formatWhatsAppNumber($this->fromNumber);
        $to = $this->formatWhatsAppNumber($normalized);

        try {
            $response = Http::withBasicAuth($this->accountSid, $this->authToken)
                ->asForm()
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$this->accountSid}/Messages.json", [
                    'From' => $from,
                    'To' => $to,
                    'ContentSid' => $this->contentSid,
                    'ContentVariables' => json_encode($contentVariables),
                ]);

            $payload = $response->json() ?: ['raw' => $response->body()];

            if ($response->successful()) {
                return [
                    'success' => true,
                    'status' => 'sent',
                    'error' => null,
                    'provider_response' => json_encode($payload),
                    'provider_sid' => $payload['sid'] ?? null,
                    'content_sid' => $this->contentSid,
                    'content_variables' => json_encode($contentVariables),
                    'phone_number' => $normalized,
                ];
            }

            $error = $payload['message'] ?? $response->body();
            Log::error('Twilio WhatsApp template send failed', [
                'to' => $to,
                'content_sid' => $this->contentSid,
                'status' => $response->status(),
                'response' => $payload,
            ]);

            return [
                'success' => false,
                'status' => 'failed',
                'error' => $error,
                'provider_response' => json_encode($payload),
                'content_sid' => $this->contentSid,
                'content_variables' => json_encode($contentVariables),
                'phone_number' => $normalized,
            ];
        } catch (\Throwable $e) {
            Log::error('Twilio WhatsApp template exception', [
                'to' => $to,
                'content_sid' => $this->contentSid,
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => 'failed',
                'error' => $e->getMessage(),
                'provider_response' => null,
                'content_sid' => $this->contentSid,
                'content_variables' => json_encode($contentVariables),
                'phone_number' => $normalized,
            ];
        }
    }

    protected function formatWhatsAppNumber(string $phone): string
    {
        if (strpos($phone, 'whatsapp:') === 0) {
            return $phone;
        }

        $normalized = $this->normalizePhoneNumber($phone);
        if (! $normalized) {
            $digits = preg_replace('/[^\d+]/', '', $phone);
            $normalized = strpos($digits, '+') === 0 ? $digits : '+'.$digits;
        }

        return 'whatsapp:'.$normalized;
    }
}
