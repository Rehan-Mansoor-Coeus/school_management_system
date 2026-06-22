<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

/**
 * Resolves which institution an academic write/read should target.
 *
 * Platform super-admins manage every institution, so they may target any
 * institution by sending an `institution_id`. Institution-scoped users are
 * always locked to their own institution and can never reach another one.
 */
trait ResolvesScopedInstitution
{
    protected function userIsPlatformAdmin(Request $request): bool
    {
        $user = $request->user();
        if (! $user) {
            return false;
        }

        return $user->roles
            ->whereIn('name', ['system-super-admin'])
            ->isNotEmpty();
    }

    /**
     * The institution a create/list should be scoped to. Returns null when it
     * cannot be determined (e.g. platform admin that has not picked one yet).
     */
    protected function scopedInstitutionId(Request $request): ?int
    {
        $user = $request->user();
        $requested = $request->input('institution_id');

        if ($this->userIsPlatformAdmin($request)) {
            if ($requested) {
                return (int) $requested;
            }

            return $user && $user->institution_id ? (int) $user->institution_id : null;
        }

        if ($user && $user->institution_id) {
            return (int) $user->institution_id;
        }

        return $requested ? (int) $requested : null;
    }

    /**
     * Whether the current user is allowed to manage records owned by the given
     * institution. Platform admins can manage any; others only their own.
     */
    protected function canManageInstitution(Request $request, $institutionId): bool
    {
        if ($this->userIsPlatformAdmin($request)) {
            return true;
        }

        $user = $request->user();

        return $user && (int) $user->institution_id === (int) $institutionId;
    }
}
