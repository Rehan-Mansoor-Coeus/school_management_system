<?php

namespace App\Modules\Hr\Services;

use App\Role;
use App\User;
use App\Modules\Hr\Models\HrInstitutionSetting;
use App\Modules\Hr\Models\HrStaffProfile;

class HrStaffService
{
    public function nextStaffCode($institutionId)
    {
        $setting = HrInstitutionSetting::where('institution_id', $institutionId)->first();
        $prefix = $setting && $setting->staff_code_prefix ? $setting->staff_code_prefix : 'HR';

        $last = HrStaffProfile::where('institution_id', $institutionId)
            ->orderBy('id', 'desc')
            ->value('staff_code');

        $next = 1;
        if ($last && preg_match('/(\d+)$/', $last, $matches)) {
            $next = ((int) $matches[1]) + 1;
        }

        return strtoupper($prefix) . '-' . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    public function promoteUserToStaff($institutionId, $userId)
    {
        $user = User::where('institution_id', $institutionId)->find($userId);
        if (! $user) {
            return null;
        }

        $staffRole = Role::where('guard_name', 'api')->where('name', 'staff')->first();
        if ($staffRole && ! $user->hasRole('staff')) {
            $user->assignRole($staffRole);
        }

        $user->status = 'active';
        $user->save();

        return $user;
    }
}
