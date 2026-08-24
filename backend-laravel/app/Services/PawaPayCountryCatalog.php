<?php

namespace App\Services;

/**
 * Maps an institution's country/currency to PawaPay providers.
 * Students never choose a country — only a local operator and phone number.
 */
class PawaPayCountryCatalog
{
    public static function forInstitution($institution): ?array
    {
        if (! $institution) {
            return null;
        }

        $country = self::resolveCountry(
            (string) ($institution->country ?? ''),
            (string) ($institution->currency ?? '')
        );

        return $country ? self::present($country) : null;
    }

    public static function forPhone(string $phone): ?array
    {
        $digits = self::digitsOnly($phone);
        if ($digits === '') {
            return null;
        }

        $matches = [];
        foreach (self::countries() as $entry) {
            $prefix = $entry['prefix'];
            $min = strlen($prefix) + max(1, (int) $entry['local_length'] - 2);
            if (strpos($digits, $prefix) === 0 && strlen($digits) >= $min) {
                $matches[] = $entry;
            }
        }

        if (! $matches) {
            return null;
        }

        usort($matches, function ($a, $b) {
            return strlen($b['prefix']) - strlen($a['prefix']);
        });

        return self::present($matches[0]);
    }

    /**
     * Payer rail: phone prefix, then applicant country, then the school.
     */
    public static function forPayer(string $phone, $applicantCountry = null, $institution = null): ?array
    {
        $fromPhone = self::forPhone($phone);
        if ($fromPhone) {
            return $fromPhone;
        }

        if ($applicantCountry) {
            $fromApplicant = self::resolveCountry((string) $applicantCountry);
            if ($fromApplicant) {
                return self::present($fromApplicant);
            }
        }

        return self::forInstitution($institution);
    }

    public static function schoolContext($institution): array
    {
        $catalog = self::forInstitution($institution);

        return [
            'country_code' => $catalog['country_code'] ?? null,
            'country_name' => $catalog['country_name'] ?? (optional($institution)->country),
            'currency' => $catalog['currency'] ?? strtoupper((string) (optional($institution)->currency ?: '')),
        ];
    }

    public static function digitsOnly(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';
        if (strpos($digits, '00') === 0) {
            $digits = substr($digits, 2);
        }

        return $digits;
    }

    public static function resolveCountry(string $country, string $currency = ''): ?array
    {
        $key = self::normalizeKey($country);

        foreach (self::countries() as $entry) {
            if (in_array($key, $entry['aliases'], true)) {
                return $entry;
            }
        }

        $currencyKey = strtoupper(trim($currency));
        if ($currencyKey !== '') {
            foreach (self::countries() as $entry) {
                if ($entry['currency'] === $currencyKey) {
                    return $entry;
                }
            }
        }

        return null;
    }

    public static function present(array $country): array
    {
        return [
            'country_code' => $country['code'],
            'country_name' => $country['name'],
            'currency' => $country['currency'],
            'phone_prefix' => $country['prefix'],
            'phone_placeholder' => $country['prefix'].$country['placeholder_local'],
            'local_length' => $country['local_length'],
            'providers' => array_map(function ($provider) {
                return [
                    'code' => $provider['code'],
                    'label' => $provider['label'],
                ];
            }, $country['providers']),
            'raw' => $country,
        ];
    }

    public static function normalizePhone(string $phone, array $catalog): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';
        if (strpos($digits, '00') === 0) {
            $digits = substr($digits, 2);
        }

        $prefix = $catalog['phone_prefix'];
        $localLength = (int) $catalog['local_length'];

        if (strpos($digits, $prefix) === 0 && strlen($digits) >= strlen($prefix) + $localLength - 1) {
            return $digits;
        }

        if (strpos($digits, '0') === 0) {
            $digits = substr($digits, 1);
        }

        if (strlen($digits) === $localLength || strlen($digits) === $localLength - 1) {
            return $prefix.$digits;
        }

        return $digits;
    }

    public static function detectProvider(string $msisdn, array $catalog): ?string
    {
        $country = $catalog['raw'] ?? null;
        if (! $country) {
            return null;
        }

        $national = $msisdn;
        $prefix = $catalog['phone_prefix'];
        if (strpos($national, $prefix) === 0) {
            $national = substr($national, strlen($prefix));
        }

        foreach ($country['providers'] as $provider) {
            foreach ($provider['prefixes'] as $start) {
                if (strpos($national, $start) === 0) {
                    return $provider['code'];
                }
            }
        }

        if (count($country['providers']) === 1) {
            return $country['providers'][0]['code'];
        }

        return null;
    }

    public static function providerBelongsToCountry(string $providerCode, array $catalog): bool
    {
        foreach ($catalog['providers'] as $provider) {
            if ($provider['code'] === $providerCode) {
                return true;
            }
        }

        return false;
    }

    public static function providerAllowsDecimals(string $providerCode, array $catalog): bool
    {
        $country = $catalog['raw'] ?? null;
        if (! $country) {
            return false;
        }

        foreach ($country['providers'] as $provider) {
            if ($provider['code'] === $providerCode) {
                return ! empty($provider['decimals']);
            }
        }

        return false;
    }

    public static function formatAmount($amount, bool $allowDecimals): string
    {
        $numeric = (float) $amount;
        if ($numeric < 0) {
            $numeric = 0;
        }

        if (! $allowDecimals) {
            return (string) (int) round($numeric);
        }

        $formatted = number_format($numeric, 2, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted === '' ? '0' : $formatted;
    }

    protected static function normalizeKey(string $value): string
    {
        $value = strtolower(trim($value));
        $value = str_replace(['+', ' '], '', $value);

        return $value;
    }

    protected static function countries(): array
    {
        return [
            [
                'code' => 'UGA',
                'name' => 'Uganda',
                'currency' => 'UGX',
                'prefix' => '256',
                'local_length' => 9,
                'placeholder_local' => '7XXXXXXXX',
                'aliases' => ['uganda', 'ug', 'uga', '256'],
                'providers' => [
                    ['code' => 'MTN_MOMO_UGA', 'label' => 'MTN', 'prefixes' => ['77', '78', '76', '39', '31'], 'decimals' => true],
                    ['code' => 'AIRTEL_OAPI_UGA', 'label' => 'Airtel', 'prefixes' => ['70', '75', '74', '20'], 'decimals' => false],
                ],
            ],
            [
                'code' => 'RWA',
                'name' => 'Rwanda',
                'currency' => 'RWF',
                'prefix' => '250',
                'local_length' => 9,
                'placeholder_local' => '7XXXXXXXX',
                'aliases' => ['rwanda', 'rw', 'rwa', '250'],
                'providers' => [
                    ['code' => 'MTN_MOMO_RWA', 'label' => 'MTN', 'prefixes' => ['78', '79'], 'decimals' => false],
                    ['code' => 'AIRTEL_RWA', 'label' => 'Airtel', 'prefixes' => ['72', '73'], 'decimals' => false],
                ],
            ],
            [
                'code' => 'KEN',
                'name' => 'Kenya',
                'currency' => 'KES',
                'prefix' => '254',
                'local_length' => 9,
                'placeholder_local' => '7XXXXXXXX',
                'aliases' => ['kenya', 'ke', 'ken', '254'],
                'providers' => [
                    ['code' => 'MPESA_KEN', 'label' => 'M-Pesa', 'prefixes' => ['70', '71', '72', '74', '79', '11', '10', '01'], 'decimals' => false],
                ],
            ],
            [
                'code' => 'CMR',
                'name' => 'Cameroon',
                'currency' => 'XAF',
                'prefix' => '237',
                'local_length' => 9,
                'placeholder_local' => '6XXXXXXXX',
                'aliases' => ['cameroon', 'cameroun', 'cm', 'cmr', '237'],
                'providers' => [
                    ['code' => 'MTN_MOMO_CMR', 'label' => 'MTN', 'prefixes' => ['67', '650', '651', '652', '653', '654', '680', '681', '682', '683', '684'], 'decimals' => false],
                    ['code' => 'ORANGE_CMR', 'label' => 'Orange', 'prefixes' => ['69', '655', '656', '657', '658', '659'], 'decimals' => false],
                ],
            ],
            [
                'code' => 'TZA',
                'name' => 'Tanzania',
                'currency' => 'TZS',
                'prefix' => '255',
                'local_length' => 9,
                'placeholder_local' => '7XXXXXXXX',
                'aliases' => ['tanzania', 'tz', 'tza', '255'],
                'providers' => [
                    ['code' => 'VODACOM_TZA', 'label' => 'Vodacom', 'prefixes' => ['74', '75', '76'], 'decimals' => false],
                    ['code' => 'AIRTEL_TZA', 'label' => 'Airtel', 'prefixes' => ['68', '69', '78'], 'decimals' => true],
                    ['code' => 'TIGO_TZA', 'label' => 'Tigo', 'prefixes' => ['65', '67', '71'], 'decimals' => false],
                    ['code' => 'HALOTEL_TZA', 'label' => 'Halotel', 'prefixes' => ['61', '62'], 'decimals' => false],
                ],
            ],
            [
                'code' => 'NGA',
                'name' => 'Nigeria',
                'currency' => 'NGN',
                'prefix' => '234',
                'local_length' => 10,
                'placeholder_local' => '8XXXXXXXXX',
                'aliases' => ['nigeria', 'ng', 'nga', '234'],
                'providers' => [
                    ['code' => 'MTN_MOMO_NGA', 'label' => 'MTN', 'prefixes' => ['803', '806', '813', '814', '816', '703', '706', '810', '903', '906'], 'decimals' => true],
                    ['code' => 'AIRTEL_NGA', 'label' => 'Airtel', 'prefixes' => ['802', '808', '812', '701', '708', '902', '907', '901'], 'decimals' => false],
                ],
            ],
            [
                'code' => 'GHA',
                'name' => 'Ghana',
                'currency' => 'GHS',
                'prefix' => '233',
                'local_length' => 9,
                'placeholder_local' => '2XXXXXXX',
                'aliases' => ['ghana', 'gh', 'gha', '233'],
                'providers' => [
                    ['code' => 'MTN_MOMO_GHA', 'label' => 'MTN', 'prefixes' => ['24', '54', '55', '59'], 'decimals' => true],
                    ['code' => 'AIRTELTIGO_GHA', 'label' => 'AT', 'prefixes' => ['27', '57', '26', '56'], 'decimals' => true],
                    ['code' => 'VODAFONE_GHA', 'label' => 'Vodafone', 'prefixes' => ['20', '50'], 'decimals' => true],
                ],
            ],
            [
                'code' => 'ZMB',
                'name' => 'Zambia',
                'currency' => 'ZMW',
                'prefix' => '260',
                'local_length' => 9,
                'placeholder_local' => '7XXXXXXXX',
                'aliases' => ['zambia', 'zm', 'zmb', '260'],
                'providers' => [
                    ['code' => 'MTN_MOMO_ZMB', 'label' => 'MTN', 'prefixes' => ['76', '96'], 'decimals' => true],
                    ['code' => 'AIRTEL_OAPI_ZMB', 'label' => 'Airtel', 'prefixes' => ['97', '77'], 'decimals' => true],
                    ['code' => 'ZAMTEL_ZMB', 'label' => 'Zamtel', 'prefixes' => ['95'], 'decimals' => true],
                ],
            ],
        ];
    }
}
