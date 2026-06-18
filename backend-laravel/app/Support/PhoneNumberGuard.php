<?php

namespace App\Support;

use App\Services\Messaging\WhatsAppService;
use App\User;

class PhoneNumberGuard
{
    public static function normalize(?string $phone): ?string
    {
        $phone = trim((string) $phone);
        if ($phone === '') {
            return null;
        }

        return app(WhatsAppService::class)->normalizePhoneNumber($phone) ?: $phone;
    }

    /**
     * @return string[]
     */
    public static function variants(?string $phone): array
    {
        $phone = trim((string) $phone);
        if ($phone === '') {
            return [];
        }

        $normalized = self::normalize($phone);

        return array_values(array_unique(array_filter([$phone, $normalized])));
    }

    public static function findConflictingUser(?string $phone, ?int $ignoreUserId = null): ?User
    {
        $variants = self::variants($phone);
        if ($variants === []) {
            return null;
        }

        $query = User::query()->where(function ($q) use ($variants) {
            $q->whereIn('phone_number', $variants)
                ->orWhereIn('additional_phone_number', $variants);
        });

        if ($ignoreUserId) {
            $query->where('id', '!=', $ignoreUserId);
        }

        return $query->orderBy('id')->first();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, string[]>
     */
    public static function validationErrors(array $payload, ?int $ignoreUserId = null): array
    {
        $errors = [];

        foreach (['phone_number', 'additional_phone_number'] as $field) {
            $value = $payload[$field] ?? null;
            if (! is_string($value) || trim($value) === '') {
                continue;
            }

            $conflict = self::findConflictingUser($value, $ignoreUserId);
            if ($conflict) {
                $errors[$field] = [
                    'This phone number is already used by '.$conflict->name
                    .' ('.$conflict->email.')'.'. Each login account needs a unique phone number.',
                ];
            }
        }

        return $errors;
    }
}
