<?php

namespace App\Modules\Admissions\Services;

use App\Services\InstitutionPaymentConfigResolver;
use App\Support\HttpClient;
use Illuminate\Support\Facades\Log;

class StripePaymentService
{
    protected $secretKey;

    protected $publicKey;

    protected $institutionId;

    protected $lastError;

    protected static $zeroDecimalCurrencies = [
        'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
    ];

    public function __construct(?int $institutionId = null)
    {
        $this->institutionId = $institutionId;
        $config = $institutionId
            ? (new InstitutionPaymentConfigResolver())->stripe($institutionId)
            : [
                'public_key' => config('services.stripe.key'),
                'secret_key' => config('services.stripe.secret'),
            ];

        $this->secretKey = $config['secret_key'] ?? null;
        $this->publicKey = $config['public_key'] ?? null;
    }

    public static function forInstitution(int $institutionId): self
    {
        return new self($institutionId);
    }

    public function isConfigured(): bool
    {
        return ! empty($this->secretKey) && ! empty($this->publicKey);
    }

    public function publicKey(): ?string
    {
        return $this->publicKey;
    }

    public function lastError(): ?string
    {
        return $this->lastError;
    }

    public function amountInMinorUnits(float $amount, string $currency): int
    {
        $currency = strtolower($currency);
        if (in_array($currency, self::$zeroDecimalCurrencies, true)) {
            return max(1, (int) round($amount));
        }

        return max(1, (int) round($amount * 100));
    }

    public function createPaymentIntent(float $amount, string $currency, array $metadata = []): ?array
    {
        $this->lastError = null;

        if (! $this->isConfigured()) {
            $this->lastError = 'Stripe keys are not configured.';

            return null;
        }

        $minorUnits = $this->amountInMinorUnits($amount, $currency);

        try {
            $response = HttpClient::postForm(
                'https://api.stripe.com/v1/payment_intents',
                array_merge([
                    'amount' => $minorUnits,
                    'currency' => strtolower($currency),
                    'automatic_payment_methods[enabled]' => 'true',
                ], $this->flattenMetadata($metadata)),
                ['Authorization' => 'Bearer '.$this->secretKey]
            );

            if (! $response->successful()) {
                $body = $response->json();
                $this->lastError = $body['error']['message'] ?? $response->body();
                Log::warning('Stripe PaymentIntent failed', ['body' => $response->body()]);

                return null;
            }

            return $response->json();
        } catch (\Exception $e) {
            $this->lastError = $e->getMessage();
            Log::warning('Stripe PaymentIntent exception: '.$e->getMessage());

            return null;
        }
    }

    public function retrievePaymentIntent(string $intentId): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        try {
            $response = HttpClient::get(
                'https://api.stripe.com/v1/payment_intents/'.$intentId,
                ['Authorization' => 'Bearer '.$this->secretKey]
            );

            return $response->successful() ? $response->json() : null;
        } catch (\Exception $e) {
            Log::warning('Stripe retrieve intent failed: '.$e->getMessage());

            return null;
        }
    }

    protected function flattenMetadata(array $metadata): array
    {
        $flat = [];
        foreach ($metadata as $key => $value) {
            $flat['metadata['.$key.']'] = (string) $value;
        }

        return $flat;
    }
}
