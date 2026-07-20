<?php

namespace App\Http\Controllers\Api\Letters\Concerns;

use App\Support\AdminContext;
use App\Support\PlatformAccess;
use Illuminate\Http\Request;

trait ResolvesLettersContext
{
    protected function institutionId(Request $request)
    {
        return AdminContext::requireInstitutionId($request);
    }

    protected function canAccessInstitution(Request $request, $institutionId)
    {
        $active = AdminContext::activeInstitutionId($request);
        if (! $active) {
            return false;
        }

        return (int) $active === (int) $institutionId;
    }

    protected function hasAnyPermission(Request $request, array $permissions)
    {
        $user = $request->user();
        if (! $user) {
            return false;
        }
        if (PlatformAccess::isPlatformSuperAdmin($user) && AdminContext::isInInstitutionContext($request, $user)) {
            return true;
        }
        foreach ($permissions as $permission) {
            if ($user->hasPermissionTo($permission)) {
                return true;
            }
        }

        return false;
    }
}
