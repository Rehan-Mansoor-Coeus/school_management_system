<?php

namespace App\Support;

use App\User;

/**
 * Platform accounts that must never be deleted or stripped of super-admin access.
 */
class ProtectedSystemAccounts
{
    public static function protectedEmails(): array
    {
        $fromEnv = array_filter(array_map('trim', explode(',', (string) env('SYSTEM_ADMIN_EMAILS', 'admin@test.com'))));

        return $fromEnv !== [] ? array_values(array_unique($fromEnv)) : ['admin@test.com'];
    }

    public static function isProtectedEmail(?string $email): bool
    {
        if (! $email) {
            return false;
        }

        return in_array(strtolower(trim($email)), array_map('strtolower', self::protectedEmails()), true);
    }

    public static function isProtected(User $user): bool
    {
        return self::isProtectedEmail($user->email);
    }

    public static function defaultPassword(): string
    {
        return (string) env('SYSTEM_ADMIN_PASSWORD', 'admin123');
    }
}
