<?php

namespace App\Support;

class PlatformAccess
{
    /** Cross-institution platform operator (all institutions). */
    public const SYSTEM_SUPER_ADMIN_ROLES = ['system-super-admin'];

    /** Institution-level super admin (single institution). */
    public const INSTITUTION_SUPER_ADMIN_ROLES = ['super-admin'];

    public const PLATFORM_SUPER_ADMIN_ROLES = ['system-super-admin'];

    public static function roles(): array
    {
        return self::SYSTEM_SUPER_ADMIN_ROLES;
    }

    public static function isSystemSuperAdmin($user): bool
    {
        return $user && $user->hasRole(self::SYSTEM_SUPER_ADMIN_ROLES);
    }

    public static function isInstitutionSuperAdmin($user): bool
    {
        return $user && $user->hasRole(self::INSTITUTION_SUPER_ADMIN_ROLES);
    }

    public static function isPlatformSuperAdmin($user): bool
    {
        return self::isSystemSuperAdmin($user);
    }

    public static function isPlatformRole($role): bool
    {
        $name = is_string($role) ? $role : optional($role)->name;

        return in_array($name, self::SYSTEM_SUPER_ADMIN_ROLES, true);
    }
}
