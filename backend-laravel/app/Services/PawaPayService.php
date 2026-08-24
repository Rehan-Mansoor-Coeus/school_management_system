<?php

namespace App\Services;

use App\Support\HttpClient;
use Illuminate\Support\Facades\Log;

class PawaPayService
{
    public function isConfigured(): bool
    {
        return ! empty($this->token());
    }

    public function token(): string
    {
        return (string) config('services.pawapay.api_token');
    }

    public function baseUrl(): string
    {
        return rtrim((string) config('services.pawapay.base_url', 'https://api.pawapay.io'), '/');
    }

    public function createDeposit(array $payload): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        try {
            $response = HttpClient::postJson(
                $this->baseUrl().'/v2/deposits',
                $payload,
                $this->headers()
            );

            $json = $response->json();
            if (! is_array($json)) {
                Log::warning('PawaPay deposit returned a non-JSON response', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            if (! $response->successful() && empty($json['status'])) {
                Log::warning('PawaPay deposit HTTP error', [
                    'status' => $response->status(),
                    'body' => $json,
                ]);
            }

            return $json;
        } catch (\Throwable $e) {
            Log::error('PawaPay deposit request failed: '.$e->getMessage());

            return null;
        }
    }

    public function getDeposit(string $depositId): ?array
    {
        if (! $this->isConfigured() || $depositId === '') {
            return null;
        }

        try {
            $response = HttpClient::get(
                $this->baseUrl().'/v2/deposits/'.rawurlencode($depositId),
                $this->headers()
            );

            $json = $response->json();

            return is_array($json) ? $json : null;
        } catch (\Throwable $e) {
            Log::error('PawaPay deposit status failed: '.$e->getMessage());

            return null;
        }
    }

    public function predictProvider(string $phone): ?array
    {
        if (! $this->isConfigured() || $phone === '') {
            return null;
        }

        try {
            $response = HttpClient::postJson(
                $this->baseUrl().'/v2/predict-provider',
                ['phoneNumber' => $phone],
                $this->headers()
            );

            $json = $response->json();

            return is_array($json) ? $json : null;
        } catch (\Throwable $e) {
            Log::warning('PawaPay predict-provider failed: '.$e->getMessage());

            return null;
        }
    }

    public function extractDepositStatus(?array $payload): string
    {
        if (! $payload) {
            return 'PENDING';
        }

        if (isset($payload[0]) && is_array($payload[0])) {
            $payload = $payload[0];
        }

        $candidates = [
            data_get($payload, 'data.status'),
            data_get($payload, 'deposit.status'),
            $payload['status'] ?? null,
        ];

        foreach ($candidates as $status) {
            if (! is_string($status) || $status === '') {
                continue;
            }

            $upper = strtoupper($status);
            if (in_array($upper, ['FOUND', 'NOT_FOUND'], true)) {
                continue;
            }

            return $upper;
        }

        return 'PENDING';
    }

    public function extractDepositId(?array $payload): ?string
    {
        if (! $payload) {
            return null;
        }

        if (isset($payload[0]) && is_array($payload[0])) {
            $payload = $payload[0];
        }

        $id = data_get($payload, 'depositId')
            ?: data_get($payload, 'data.depositId')
            ?: data_get($payload, 'deposit.depositId');

        return is_string($id) && $id !== '' ? $id : null;
    }

    protected function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->token(),
            'Accept' => 'application/json',
        ];
    }
}
