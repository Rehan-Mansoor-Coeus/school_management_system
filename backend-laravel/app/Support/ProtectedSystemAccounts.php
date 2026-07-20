<?php

namespace App\Support;

use App\User;

/**
 * Platform accounts that must never be deleted or stripped of platform super-admin access.
 */
class ProtectedSystemAccounts
{
    public static function protectedEmails(): array
    {
        $defaults = ['admin@okusoma.com', 'admin@test.com'];
        $fromEnv = array_filter(array_map('trim', explode(',', (string) env('SYSTEM_ADMIN_EMAILS', ''))));
        $emails = $fromEnv !== [] ? array_merge($defaults, $fromEnv) : $defaults;

        return array_values(array_unique(array_map('strtolower', $emails)));
    }

    public static function isProtectedEmail(?string $email): bool
    {
        if (! $email) {
            return false;
        }

        return in_array(strtolower(trim($email)), self::protectedEmails(), true);
    }

    public static function isProtected(User $user): bool
    {
        if (self::isProtectedEmail($user->email)) {
            return true;
        }

        $username = strtolower(trim((string) ($user->username ?? '')));

        return in_array($username, ['admin', 'system-admin'], true);
    }

    public static function defaultPassword(): string
    {
        return (string) env('SYSTEM_ADMIN_PASSWORD', 'system');
    }
}
