<?php

namespace App\Modules\Admissions\Services;

use App\Services\InstitutionPaymentConfigResolver;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StripePaymentService
{
    protected $secretKey;

    protected $publicKey;

    protected $institutionId;

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

    public function createPaymentIntent(float $amount, string $currency, array $metadata = []): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        $minorUnits = (int) round($amount * 100);
        if ($minorUnits < 1) {
            $minorUnits = 1;
        }

        try {
            $response = Http::asForm()
                ->withToken($this->secretKey)
                ->post('https://api.stripe.com/v1/payment_intents', array_merge([
                    'amount' => $minorUnits,
                    'currency' => strtolower($currency),
                    'automatic_payment_methods[enabled]' => 'true',
                ], $this->flattenMetadata($metadata)));

            if (! $response->successful()) {
                Log::warning('Stripe PaymentIntent failed', ['body' => $response->body()]);

                return null;
            }

            return $response->json();
        } catch (\Exception $e) {
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
            $response = Http::withToken($this->secretKey)
                ->get('https://api.stripe.com/v1/payment_intents/'.$intentId);

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
