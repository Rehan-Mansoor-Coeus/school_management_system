<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Institution;
use App\PlatformAuditLog;
use App\Support\AdminContext;
use App\Support\PlatformAccess;
use Illuminate\Http\Request;

class AdminContextController extends Controller
{
    public function switchInstitution(Request $request, Institution $institution)
    {
        $user = $request->user();
        if (! PlatformAccess::isPlatformSuperAdmin($user)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        PlatformAuditLog::record($user->id, 'switch_institution', $institution->id, [
            'institution_name' => $institution->name,
            'institution_code' => $institution->code,
        ], $request);

        $request->headers->set(AdminContext::HEADER, (string) $institution->id);

        return response()->json(array_merge([
            'message' => 'Switched into institution context.',
        ], $this->payload($request, $user)));
    }

    public function leaveInstitution(Request $request)
    {
        $user = $request->user();
        if (! PlatformAccess::isPlatformSuperAdmin($user)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $previous = AdminContext::requestedInstitutionId($request);
        PlatformAuditLog::record($user->id, 'return_to_platform', $previous, [], $request);

        $user->load(['roles']);
        $permissions = $user->getAllPermissions()->pluck('name')->values();

        return response()->json([
            'message' => 'Returned to platform context.',
            'user' => $user,
            'permissions' => $permissions,
            'role_type' => 'platform_super_admin',
            'context_type' => 'platform',
            'acting_as_super_admin' => false,
            'active_institution' => null,
            'active_institution_id' => null,
            'institution' => null,
            'enabled_modules' => [],
        ]);
    }

    public function current(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json($this->payload($request, $user));
    }

    protected function payload(Request $request, $user)
    {
        $user->load(['roles']);
        $context = AdminContext::authContextPayload($request, $user);

        return array_merge([
            'user' => $user,
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ], $context);
    }
}
