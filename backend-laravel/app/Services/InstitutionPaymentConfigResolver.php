<?php

namespace App\Services;

use App\InstitutionSetting;

class InstitutionPaymentConfigResolver
{
    public function gateways(int $institutionId): array
    {
        $settings = InstitutionSetting::where('institution_id', $institutionId)->first();

        return data_get($settings, 'payment_settings.gateways', []) ?: [];
    }

    public function stripe(int $institutionId): array
    {
        $gateway = data_get($this->gateways($institutionId), 'stripe', []);
        $publicKey = $gateway['publicKey'] ?? $gateway['public_key'] ?? config('services.stripe.key');
        $secretKey = $gateway['secretKey'] ?? $gateway['secret_key'] ?? config('services.stripe.secret');
        $hasKeys = ! empty($publicKey) && ! empty($secretKey);

        return [
            'enabled' => $hasKeys && ($gateway['enabled'] ?? true),
            'public_key' => $publicKey,
            'secret_key' => $secretKey,
            'currency' => config('services.stripe.currency', 'usd'),
            'webhook_secret' => $gateway['webhookSecret'] ?? $gateway['webhook_secret'] ?? config('services.stripe.webhook_secret'),
        ];
    }

    public function campay(int $institutionId): array
    {
        $gateway = data_get($this->gateways($institutionId), 'campay', []);
        $momoToken = $gateway['momo_token'] ?? $gateway['momoToken'] ?? null;
        $username = $gateway['momo_app_username'] ?? $gateway['momoAppUsername'] ?? config('services.campay.username');
        $password = $gateway['momo_app_password'] ?? $gateway['momoAppPassword'] ?? config('services.campay.password');
        $hasCredentials = ! empty($momoToken) || (! empty($username) && ! empty($password));

        return [
            'enabled' => $hasCredentials && ($gateway['enabled'] ?? true),
            'momo_token' => $momoToken,
            'momo_app_id' => $gateway['momo_app_id'] ?? $gateway['momoAppId'] ?? null,
            'momo_app_username' => $username,
            'momo_app_password' => $password,
            'momo_app_webhook' => $gateway['momo_app_webhook'] ?? $gateway['momoAppWebhook'] ?? null,
            'environment' => $gateway['environment'] ?? config('services.campay.environment', 'DEV'),
            'currency' => $gateway['currency'] ?? config('services.campay.currency', 'XAF'),
        ];
    }

    public function flutterwave(int $institutionId): array
    {
        $gateway = data_get($this->gateways($institutionId), 'flutterwave', []);

        return [
            'enabled' => (bool) ($gateway['enabled'] ?? false),
            'public_key' => $gateway['apiKey'] ?? $gateway['api_key'] ?? config('services.flutterwave.public_key'),
            'secret_key' => $gateway['secretKey'] ?? $gateway['secret_key'] ?? config('services.flutterwave.secret_key'),
        ];
    }
}
