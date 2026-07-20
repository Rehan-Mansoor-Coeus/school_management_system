<?php

namespace App\Services\Messaging;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Unified WasenderAPI WhatsApp service for text, OTP, documents, and media.
 */
class WhatsAppService
{
    protected $baseUrl;
    protected $token;
    protected $sessionId;
    protected $appUrl;

    public function __construct()
    {
        $this->baseUrl = $this->normalizeBaseUrl((string) config('services.wasender.base_url', 'https://wasenderapi.com'));
        $this->token = (string) config('services.wasender.api_key', '');
        $this->sessionId = (string) config('services.wasender.session_id', '');
        $this->appUrl = rtrim((string) config('app.url', ''), '/');
    }

    public function isConfigured(): bool
    {
        return $this->token !== '';
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

        if (strpos($clean, '00') === 0 && strlen($clean) > 2) {
            $clean = '+'.substr($clean, 2);
        }

        if (strpos($clean, '+') === 0) {
            $normalized = $clean;
        } elseif (ctype_digit($clean)) {
            $normalized = '+'.$clean;
        } else {
            $digits = preg_replace('/\D/', '', $clean);
            if ($digits === '') {
                return null;
            }
            $normalized = '+'.$digits;
        }

        $digitsOnly = preg_replace('/\D/', '', $normalized);
        if (strlen($digitsOnly) < 8 || strlen($digitsOnly) > 15) {
            return null;
        }

        return $normalized;
    }

    public function sendOtp(string $toPhone, string $otp, ?string $context = null): array
    {
        $formatter = new NotificationMessageFormatter();
        $lines = [
            $formatter->field('Verification code', $otp),
        ];
        if ($context) {
            $lines[] = $context;
        }
        $lines[] = 'This code expires in 3 minutes. Do not share it.';

        $message = $formatter->format('VERIFICATION CODE', null, $lines);

        return $this->sendTextMessage($toPhone, $message, 'otp');
    }

    public function sendTextMessage(string $toPhone, string $text, string $messageType = 'text'): array
    {
        return $this->postMessage([
            'to' => $toPhone,
            'text' => $text,
        ], $messageType);
    }

    public function sendDocumentMessage(string $toPhone, string $documentUrl, ?string $text = null, ?string $fileName = null): array
    {
        $payload = [
            'to' => $toPhone,
            'documentUrl' => $documentUrl,
        ];
        if ($text) {
            $payload['text'] = $text;
        }
        if ($fileName) {
            $payload['fileName'] = $fileName;
        }

        return $this->postMessage($payload, 'document');
    }

    public function sendImageMessage(string $toPhone, string $imageUrl, ?string $text = null): array
    {
        $payload = [
            'to' => $toPhone,
            'imageUrl' => $imageUrl,
        ];
        if ($text) {
            $payload['text'] = $text;
        }

        return $this->postMessage($payload, 'image');
    }

    public function uploadLocalFile(string $storagePath, ?string $mimeType = null): array
    {
        if (! $this->isConfigured()) {
            return ['success' => false, 'error' => 'WhatsApp API is not configured.', 'public_url' => null];
        }

        if (! Storage::disk('public')->exists($storagePath)) {
            return ['success' => false, 'error' => 'Attachment file not found.', 'public_url' => null];
        }

        $mimeType = $mimeType ?: Storage::disk('public')->mimeType($storagePath) ?: 'application/octet-stream';
        $binary = Storage::disk('public')->get($storagePath);

        $response = $this->request('POST', $this->endpoint('/upload'), [
            'headers' => [
                'Content-Type' => $mimeType,
                'Accept' => 'application/json',
            ],
            'body' => $binary,
        ]);

        $payload = $response['json'] ?: ['raw' => $response['body']];

        if ($response['success'] && ! empty($payload['publicUrl'])) {
            return [
                'success' => true,
                'public_url' => $payload['publicUrl'],
                'provider_response' => json_encode($payload),
                'error' => null,
            ];
        }

        $error = $payload['message'] ?? $payload['error'] ?? $response['body'];

        return [
            'success' => false,
            'public_url' => null,
            'provider_response' => json_encode($payload),
            'error' => is_string($error) ? $error : 'Upload failed.',
        ];
    }

    public function publicUrlForStoragePath(string $storagePath): ?string
    {
        if ($this->appUrl === '') {
            return null;
        }

        return $this->appUrl.'/storage/'.ltrim($storagePath, '/');
    }

    protected function postMessage(array $payload, string $messageType = 'text'): array
    {
        if (! $this->isConfigured()) {
            return $this->failure('WhatsApp API is not configured. Set WASENDER_API_KEY in .env.', $payload['to'] ?? null);
        }

        $to = $this->normalizePhoneNumber((string) ($payload['to'] ?? ''));
        if (! $to) {
            return $this->failure('Invalid or missing phone number.', $payload['to'] ?? null);
        }

        $payload['to'] = $to;

        $response = $this->request('POST', $this->endpoint('/send-message'), [
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'json' => $payload,
        ]);

        $body = $response['json'] ?: ['raw' => $response['body']];

        if ($response['success'] && ($body['success'] ?? false)) {
            return [
                'success' => true,
                'status' => 'sent',
                'message_type' => $messageType,
                'error' => null,
                'phone_number' => $to,
                'provider_response' => json_encode($body),
                'provider_sid' => $body['data']['msgId'] ?? null,
            ];
        }

        $error = $body['message'] ?? $body['error'] ?? $response['body'];
        Log::warning('WhatsApp send failed', [
            'to' => $to,
            'status' => $response['status'],
            'response' => $this->sanitizeForLog($body),
        ]);

        return $this->failure(is_string($error) ? $error : 'Send failed.', $to, json_encode($body));
    }

    protected function normalizeBaseUrl(string $url): string
    {
        return rtrim(trim($url), '/');
    }

    protected function endpoint(string $suffix): string
    {
        $suffix = '/'.ltrim($suffix, '/');
        if (substr($this->baseUrl, -4) === '/api') {
            return $this->baseUrl.$suffix;
        }

        return $this->baseUrl.'/api'.$suffix;
    }

    protected function request(string $method, string $url, array $options = []): array
    {
        try {
            if (class_exists(\GuzzleHttp\Client::class)) {
                return $this->requestWithGuzzle($method, $url, $options);
            }

            return $this->requestWithCurl($method, $url, $options);
        } catch (\Throwable $e) {
            Log::error('WhatsApp request exception', [
                'method' => $method,
                'url' => preg_replace('/Bearer\s+\S+/', 'Bearer [redacted]', $url),
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => 0,
                'body' => '',
                'json' => null,
            ];
        }
    }

    protected function requestWithGuzzle(string $method, string $url, array $options): array
    {
        $client = new \GuzzleHttp\Client([
            'timeout' => 60,
            'http_errors' => false,
        ]);

        $headers = array_merge([
            'Authorization' => 'Bearer '.$this->token,
        ], $options['headers'] ?? []);

        $requestOptions = ['headers' => $headers];

        if (isset($options['json'])) {
            $requestOptions['json'] = $options['json'];
        }
        if (isset($options['body'])) {
            $requestOptions['body'] = $options['body'];
        }

        $response = $client->request($method, $url, $requestOptions);
        $status = $response->getStatusCode();
        $body = (string) $response->getBody();
        $json = json_decode($body, true);

        return [
            'success' => $status >= 200 && $status < 300,
            'status' => $status,
            'body' => $body,
            'json' => is_array($json) ? $json : null,
        ];
    }

    protected function requestWithCurl(string $method, string $url, array $options): array
    {
        $headers = [
            'Authorization: Bearer '.$this->token,
        ];

        foreach ($options['headers'] ?? [] as $key => $value) {
            $headers[] = $key.': '.$value;
        }

        $body = null;
        if (isset($options['json'])) {
            $body = json_encode($options['json']);
            $headers[] = 'Content-Type: application/json';
        } elseif (isset($options['body'])) {
            $body = $options['body'];
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 60,
        ]);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $responseBody = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($responseBody === false) {
            throw new \RuntimeException($curlError ?: 'cURL request failed.');
        }

        $json = json_decode($responseBody, true);

        return [
            'success' => $status >= 200 && $status < 300,
            'status' => $status,
            'body' => $responseBody,
            'json' => is_array($json) ? $json : null,
        ];
    }

    protected function sanitizeForLog($payload)
    {
        if (! is_array($payload)) {
            return $payload;
        }

        unset($payload['token'], $payload['authorization']);

        return $payload;
    }

    protected function failure(string $error, ?string $phone = null, ?string $providerResponse = null): array
    {
        return [
            'success' => false,
            'status' => 'failed',
            'error' => $error,
            'phone_number' => $phone,
            'provider_response' => $providerResponse,
        ];
    }
}
