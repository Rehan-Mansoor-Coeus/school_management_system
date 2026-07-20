<?php

namespace App\Support;

use App\Institution;
use App\User;
use Illuminate\Http\Request;

/**
 * Resolves platform vs institution administrative context for the current request.
 *
 * Platform Super Admins start with no institution selected. They may temporarily
 * "switch into" an institution via the X-Active-Institution-Id header (or body field).
 * Institution admins always use their assigned institution_id.
 */
class AdminContext
{
    const HEADER = 'X-Active-Institution-Id';

    public static function isPlatformSuperAdmin(?User $user): bool
    {
        return PlatformAccess::isPlatformSuperAdmin($user);
    }

    public static function isInstitutionAdmin(?User $user): bool
    {
        if (! $user || self::isPlatformSuperAdmin($user)) {
            return false;
        }

        return $user->hasRole(['admin', 'institution-admin']);
    }

    public static function requestedInstitutionId(Request $request): ?int
    {
        $raw = $request->header(self::HEADER);
        if ($raw === null || $raw === '') {
            $raw = $request->input('active_institution_id');
        }
        if ($raw === null || $raw === '' || $raw === 'null') {
            return null;
        }

        $id = (int) $raw;

        return $id > 0 ? $id : null;
    }

    public static function contextType(Request $request, ?User $user = null): string
    {
        $user = $user ?: $request->user();
        if (! $user) {
            return 'anonymous';
        }

        if (self::isPlatformSuperAdmin($user)) {
            return self::requestedInstitutionId($request) ? 'institution' : 'platform';
        }

        return 'institution';
    }

    public static function isInPlatformContext(Request $request, ?User $user = null): bool
    {
        return self::contextType($request, $user) === 'platform';
    }

    public static function isInInstitutionContext(Request $request, ?User $user = null): bool
    {
        return self::contextType($request, $user) === 'institution';
    }

    /**
     * Active institution for data scoping. Null in platform context.
     * Never defaults to institution 1.
     */
    public static function activeInstitutionId(Request $request, ?User $user = null): ?int
    {
        $user = $user ?: $request->user();
        if (! $user) {
            return null;
        }

        if (self::isPlatformSuperAdmin($user)) {
            $requested = self::requestedInstitutionId($request);
            if (! $requested) {
                return null;
            }
            if (! Institution::where('id', $requested)->exists()) {
                return null;
            }

            return $requested;
        }

        $assigned = (int) ($user->institution_id ?: 0);

        return $assigned > 0 ? $assigned : null;
    }

    /**
     * Resolve institution for operational endpoints. Throws/returns null if missing.
     * Use requireInstitutionId() when the call must fail closed.
     */
    public static function requireInstitutionId(Request $request, ?User $user = null): int
    {
        $id = self::activeInstitutionId($request, $user);
        if (! $id) {
            abort(response()->json([
                'message' => 'Institution context required. Select an institution before continuing.',
                'code' => 'INSTITUTION_CONTEXT_REQUIRED',
            ], 403));
        }

        return $id;
    }

    public static function canAccessInstitution(Request $request, $institutionId, ?User $user = null): bool
    {
        $user = $user ?: $request->user();
        if (! $user) {
            return false;
        }

        $institutionId = (int) $institutionId;
        if ($institutionId <= 0) {
            return false;
        }

        if (self::isPlatformSuperAdmin($user)) {
            // Operational access only while switched into that institution.
            $active = self::activeInstitutionId($request, $user);

            return $active !== null && $active === $institutionId;
        }

        return (int) $user->institution_id === $institutionId;
    }

    public static function roleType(?User $user): string
    {
        if (! $user) {
            return 'guest';
        }
        if (self::isPlatformSuperAdmin($user)) {
            return 'platform_super_admin';
        }
        if (self::isInstitutionAdmin($user)) {
            return 'institution_admin';
        }

        return 'institution_user';
    }

    public static function authContextPayload(Request $request, User $user): array
    {
        $contextType = self::contextType($request, $user);
        $activeId = self::activeInstitutionId($request, $user);
        $activeInstitution = null;

        if ($activeId) {
            $activeInstitution = Institution::query()
                ->where('id', $activeId)
                ->first(['id', 'name', 'code', 'is_active', 'subscription_status', 'subscription_expires_at', 'logo_url', 'acronym']);
        }

        // Platform home institution for display only — never used as operational scope.
        $homeInstitution = null;
        if (! self::isPlatformSuperAdmin($user) && $user->institution_id) {
            $homeInstitution = $user->institution;
        }

        $modules = [];
        if ($activeId) {
            $modules = \Illuminate\Support\Facades\DB::table('institution_modules')
                ->join('modules', 'modules.id', '=', 'institution_modules.module_id')
                ->where('institution_modules.institution_id', $activeId)
                ->where('institution_modules.enabled', true)
                ->pluck('modules.key')
                ->values();
        }

        return [
            'role_type' => self::roleType($user),
            'context_type' => $contextType,
            'acting_as_super_admin' => self::isPlatformSuperAdmin($user) && $contextType === 'institution',
            'active_institution' => $activeInstitution,
            'active_institution_id' => $activeId,
            'institution' => $activeInstitution ?: $homeInstitution,
            'enabled_modules' => $modules,
        ];
    }
}
