<?php

namespace App\Support;

class PermissionCatalog
{
    public static function grouped(): array
    {
        return config('permissions', []);
    }

    public static function all(): array
    {
        $names = [];

        foreach (self::grouped() as $permissions) {
            foreach ($permissions as $permission) {
                $names[] = $permission;
            }
        }

        $names = array_values(array_unique($names));
        sort($names);

        return $names;
    }
}
