<?php

namespace App\Support;

class PlatformAccess
{
    public const PLATFORM_SUPER_ADMIN_ROLES = ['super-admin', 'system-super-admin'];

    public static function roles(): array
    {
        return self::PLATFORM_SUPER_ADMIN_ROLES;
    }

    public static function isPlatformSuperAdmin($user): bool
    {
        return $user && $user->hasRole(self::PLATFORM_SUPER_ADMIN_ROLES);
    }

    public static function isPlatformRole($role): bool
    {
        $name = is_string($role) ? $role : optional($role)->name;

        return in_array($name, self::PLATFORM_SUPER_ADMIN_ROLES, true);
    }
}
