<?php

namespace App\Services;

use App\Support\HttpClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Converts the school-currency fee into the student's MoMo currency.
 * Live USD rates are cached; fallbacks keep checkout working offline.
 */
class PawaPayFxService
{
    public function convert(float $amount, string $from, string $to): array
    {
        $from = strtoupper(trim($from));
        $to = strtoupper(trim($to));

        if ($from === '' || $to === '' || $from === $to) {
            return [
                'amount' => $amount,
                'rate' => 1.0,
                'from' => $from ?: $to,
                'to' => $to ?: $from,
            ];
        }

        $usd = $this->usdRates();
        $fromUsd = $usd[$from] ?? null;
        $toUsd = $usd[$to] ?? null;

        if (! $fromUsd || ! $toUsd) {
            throw new \RuntimeException(__('admissions.pawapay_fx_unavailable'));
        }

        $rate = $toUsd / $fromUsd;
        $converted = $amount * $rate;

        return [
            'amount' => $converted,
            'rate' => $rate,
            'from' => $from,
            'to' => $to,
        ];
    }

    protected function usdRates(): array
    {
        $fallback = $this->fallbackUsdRates();

        try {
            return Cache::remember('pawapay_fx_usd', 21600, function () use ($fallback) {
                $url = (string) config('services.pawapay.fx_url', 'https://open.er-api.com/v6/latest/USD');
                $json = HttpClient::get($url)->json();
                $rates = data_get($json, 'rates');
                if (! is_array($rates) || empty($rates['USD'])) {
                    return $fallback;
                }

                $merged = $fallback;
                foreach ($fallback as $code => $unused) {
                    if (isset($rates[$code]) && (float) $rates[$code] > 0) {
                        $merged[$code] = (float) $rates[$code];
                    }
                }

                return $merged;
            });
        } catch (\Throwable $e) {
            Log::warning('PawaPay FX lookup failed: '.$e->getMessage());

            return $fallback;
        }
    }

    protected function fallbackUsdRates(): array
    {
        return [
            'USD' => 1.0,
            'UGX' => 3600.0,
            'RWF' => 1400.0,
            'KES' => 129.0,
            'XAF' => 600.0,
            'XOF' => 600.0,
            'TZS' => 2600.0,
            'NGN' => 1550.0,
            'GHS' => 12.0,
            'ZMW' => 27.0,
        ];
    }
}
