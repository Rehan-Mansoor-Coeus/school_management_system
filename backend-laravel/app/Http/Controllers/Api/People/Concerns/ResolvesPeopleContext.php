<?php

namespace App\Http\Controllers\Api\People\Concerns;

use Illuminate\Http\Request;

trait ResolvesPeopleContext
{
    protected function institutionId(Request $request)
    {
        return (int) (optional($request->user())->institution_id ?: 1);
    }

    protected function canAccessInstitution(Request $request, $institutionId)
    {
        return (int) $this->institutionId($request) === (int) $institutionId;
    }

    protected function hasAnyPermission(Request $request, array $permissions)
    {
        $user = $request->user();
        if (! $user) {
            return false;
        }
        if ($user->hasRole('super-admin')) {
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
