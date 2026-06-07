<?php

namespace App\Modules\Admissions\Services;

use App\Services\InstitutionPaymentConfigResolver;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CampayPaymentService
{
    protected $momoToken;

    protected $momoAppId;

    protected $username;

    protected $password;

    protected $webhook;

    protected $environment;

    protected $institutionId;

    public function __construct(?int $institutionId = null)
    {
        $this->institutionId = $institutionId;
        $config = $institutionId
            ? (new InstitutionPaymentConfigResolver())->campay($institutionId)
            : [
                'momo_token' => null,
                'momo_app_id' => null,
                'momo_app_username' => config('services.campay.username'),
                'momo_app_password' => config('services.campay.password'),
                'momo_app_webhook' => null,
                'environment' => config('services.campay.environment', 'DEV'),
            ];

        $this->momoToken = $config['momo_token'] ?? null;
        $this->momoAppId = $config['momo_app_id'] ?? null;
        $this->username = $config['momo_app_username'] ?? null;
        $this->password = $config['momo_app_password'] ?? null;
        $this->webhook = $config['momo_app_webhook'] ?? null;
        $this->environment = $config['environment'] ?? 'DEV';
    }

    public static function forInstitution(int $institutionId): self
    {
        return new self($institutionId);
    }

    public function isConfigured(): bool
    {
        return ! empty($this->momoToken)
            || (! empty($this->username) && ! empty($this->password));
    }

    public function webhookUrl(): ?string
    {
        return $this->webhook;
    }

    public function baseUrl(): string
    {
        return strtoupper($this->environment) === 'PROD'
            ? 'https://www.campay.net/api'
            : 'https://demo.campay.net/api';
    }

    public function getAccessToken(): ?string
    {
        if (! empty($this->momoToken)) {
            return $this->momoToken;
        }

        if (empty($this->username) || empty($this->password)) {
            return null;
        }

        $cacheKey = 'campay_token_'.md5(($this->institutionId ?: 'global').$this->username.$this->environment);

        return Cache::remember($cacheKey, 50, function () {
            try {
                $response = Http::post(rtrim($this->baseUrl(), '/').'/token/', [
                    'username' => $this->username,
                    'password' => $this->password,
                ]);

                if (! $response->successful()) {
                    Log::warning('Campay token failed', ['body' => $response->body()]);

                    return null;
                }

                $data = $response->json();

                return $data['token'] ?? $data['access_token'] ?? null;
            } catch (\Exception $e) {
                Log::warning('Campay token exception: '.$e->getMessage());

                return null;
            }
        });
    }

    public function initiateCollect(array $payload): ?array
    {
        $token = $this->getAccessToken();
        if (! $token) {
            return null;
        }

        try {
            $body = [
                'amount' => (string) $payload['amount'],
                'currency' => $payload['currency'] ?? 'XAF',
                'from' => $payload['from'],
                'description' => $payload['description'] ?? 'Admission payment',
                'external_reference' => $payload['external_reference'],
            ];

            if ($this->momoAppId) {
                $body['app_id'] = $this->momoAppId;
            }

            $response = Http::withToken($token)
                ->post(rtrim($this->baseUrl(), '/').'/collect/', $body);

            if (! $response->successful()) {
                Log::warning('Campay collect failed', ['body' => $response->body()]);

                return null;
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::warning('Campay collect exception: '.$e->getMessage());

            return null;
        }
    }

    public function getTransactionStatus(string $reference): ?array
    {
        $token = $this->getAccessToken();
        if (! $token) {
            return null;
        }

        try {
            $response = Http::withToken($token)
                ->get(rtrim($this->baseUrl(), '/').'/transaction/'.$reference.'/');

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::warning('Campay transaction status failed: '.$e->getMessage());

            return null;
        }
    }
}
