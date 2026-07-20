<?php

namespace App\Services;

use App\Institution;
use App\Modules\Licensing\Services\InstitutionLicenseService;
use App\Support\PlatformAccess;
use App\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InstitutionStatsService
{
    protected function licenseService(): InstitutionLicenseService
    {
        return app(InstitutionLicenseService::class);
    }

    /**
     * Build a rich stats + licensing payload for a single institution.
     */
    public function forInstitution(Institution $institution): array
    {
        $institutionId = $institution->id;

        $usersBase = User::where('institution_id', $institutionId);

        $roleCount = function (array $roles) use ($institutionId) {
            return User::where('institution_id', $institutionId)
                ->whereHas('roles', function ($q) use ($roles) {
                    $q->whereIn('name', $roles);
                })
                ->count();
        };

        $stats = [
            'total_users' => (clone $usersBase)->count(),
            'login_accounts' => (clone $usersBase)->loginAccounts()->count(),
            'students' => $roleCount(['student']),
            'teachers' => $roleCount(['teacher']),
            'staff' => $roleCount(['staff']),
            'admins' => $roleCount(array_merge(PlatformAccess::PLATFORM_SUPER_ADMIN_ROLES, ['admin', 'institution-admin'])),
            'modules_enabled' => $this->enabledModuleCount($institutionId),
        ];

        $stats = array_merge($stats, $this->optionalCounts($institutionId));

        $currentLicense = $this->licensePayload($institution);

        return [
            'institution' => $this->institutionSummary($institution),
            'license' => $currentLicense,
            'current_license' => $currentLicense,
            'stats' => $stats,
        ];
    }

    /**
     * Platform-wide aggregates for the super-admin overview.
     */
    public function platformOverview(): array
    {
        $institutions = Institution::all();
        $now = Carbon::now();
        $soon = $now->copy()->addDays(30);

        $active = 0;
        $inactive = 0;
        $expired = 0;
        $expiringSoon = 0;
        $planBreakdown = [];

        foreach ($institutions as $institution) {
            if ($institution->is_active) {
                $active++;
            } else {
                $inactive++;
            }

            $expiresAt = $institution->subscription_expires_at;
            if ($expiresAt) {
                if ($expiresAt->isPast()) {
                    $expired++;
                } elseif ($expiresAt->lte($soon)) {
                    $expiringSoon++;
                }
            }

            $current = $this->licensePayload($institution);
            $plan = $current['plan']['code'] ?? ($institution->subscription_plan ?: 'free');
            $planBreakdown[$plan] = ($planBreakdown[$plan] ?? 0) + 1;
        }

        return [
            'total_schools' => $institutions->count(),
            'active_schools' => $active,
            'inactive_schools' => $inactive,
            'expired_licenses' => $expired,
            'expiring_soon' => $expiringSoon,
            'total_users' => User::count(),
            'total_login_accounts' => User::loginAccounts()->count(),
            'total_students' => User::whereHas('roles', function ($q) {
                $q->where('name', 'student');
            })->count(),
            'plans' => $planBreakdown,
        ];
    }

    public function institutionSummary(Institution $institution): array
    {
        return [
            'id' => $institution->id,
            'name' => $institution->name,
            'code' => $institution->code,
            'type' => $institution->type,
            'email' => $institution->email,
            'phone' => $institution->phone,
            'city' => $institution->city,
            'country' => $institution->country,
            'is_active' => (bool) $institution->is_active,
            'logo_url' => $institution->logo_url,
            'created_at' => $institution->created_at,
        ];
    }

    public function licensePayload(Institution $institution): array
    {
        if (Schema::hasTable('institution_licenses') && Schema::hasTable('license_plans')) {
            try {
                $payload = $this->licenseService()->toCurrentLicensePayload($institution);

                // Legacy flat aliases expected by older UI:
                return array_merge($payload, [
                    'plan' => $payload['plan_code'] ?? ($payload['plan']['code'] ?? 'free'),
                    'status' => $payload['license_status'] ?? 'active',
                    'started_at' => $payload['start_date'] ?? null,
                    'expires_at' => $payload['expiry_date'] ?? null,
                ]);
            } catch (\Throwable $e) {
                // Fall through to legacy columns if licensing tables are empty/mid-migrate.
            }
        }

        $expiresAt = $institution->subscription_expires_at;
        $daysRemaining = $expiresAt ? Carbon::now()->startOfDay()->diffInDays($expiresAt->copy()->startOfDay(), false) : null;

        return [
            'id' => null,
            'plan' => $institution->subscription_plan ?: 'free',
            'plan_code' => $institution->subscription_plan ?: 'free',
            'plan_name' => ucfirst($institution->subscription_plan ?: 'free'),
            'status' => $institution->subscription_status ?: 'active',
            'license_status' => $institution->subscription_status ?: 'active',
            'payment_status' => 'paid',
            'started_at' => $institution->subscription_started_at,
            'start_date' => optional($institution->subscription_started_at)->toDateString(),
            'expires_at' => $expiresAt,
            'expiry_date' => optional($expiresAt)->toDateString(),
            'max_users' => $institution->max_users,
            'license_key' => $institution->license_key,
            'is_expired' => $institution->is_expired,
            'days_remaining' => $daysRemaining,
            'currency' => $institution->currency ?: 'XAF',
            'enabled_modules' => [],
        ];
    }

    private function enabledModuleCount(int $institutionId): int
    {
        if (! Schema::hasTable('institution_modules')) {
            return 0;
        }

        return (int) DB::table('institution_modules')
            ->where('institution_id', $institutionId)
            ->where('enabled', true)
            ->count();
    }

    /**
     * Counts that depend on optional module tables — guarded so a missing
     * table never breaks the dashboard.
     */
    private function optionalCounts(int $institutionId): array
    {
        $counts = [];

        $tableColumnCounts = [
            'applications_total' => ['applications', 'institution_id'],
            'programmes' => ['programmes', 'institution_id'],
            'departments' => ['departments', 'institution_id'],
            'courses' => ['courses', 'institution_id'],
            'semesters' => ['semesters', 'institution_id'],
            'subjects' => ['subjects', 'institution_id'],
            'academic_years' => ['academic_years', 'institution_id'],
        ];

        foreach ($tableColumnCounts as $key => [$table, $column]) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, $column)) {
                $counts[$key] = (int) DB::table($table)->where($column, $institutionId)->count();
            } else {
                $counts[$key] = 0;
            }
        }

        return $counts;
    }
}
