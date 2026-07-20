<?php

namespace App\Modules\Licensing\Services;

use App\Institution;
use App\Module;
use App\Modules\Licensing\Models\InstitutionLicense;
use App\Modules\Licensing\Models\InstitutionSemesterLicense;
use App\Modules\Licensing\Models\LicensePlan;
use App\Student;
use App\User;
use Illuminate\Support\Facades\Schema;

class LicenseAccessService
{
    /**
     * @return array{allowed: bool, code: string|null, message: string|null, mode: string|null}
     */
    public function evaluate(Institution $institution, ?string $moduleKey = null): array
    {
        $license = $this->currentLicense($institution);

        if (! $license) {
            if (! $institution->is_active) {
                return $this->deny('LICENSE_EXPIRED', 'Institution license is inactive.');
            }

            return $this->allow();
        }

        $status = strtolower((string) $license->license_status);
        if (in_array($status, ['suspended', 'expired', 'cancelled'], true)) {
            return $this->deny('LICENSE_EXPIRED', 'Institution license is '.$status.'.');
        }

        if ($license->expiry_date && $license->expiry_date->isPast()) {
            if ($status === 'grace_period') {
                // grace still allows access
            } elseif ($status !== 'trial') {
                return $this->deny('LICENSE_EXPIRED', 'Institution license has expired.');
            }
        }

        if ($status === 'overdue' && $moduleKey && ! $this->isSetupModule($moduleKey)) {
            return $this->deny('LICENSE_EXPIRED', 'Institution license is overdue. Settle billing to continue.');
        }

        if ($moduleKey) {
            $moduleCheck = $this->evaluateModuleLicensed($institution, $moduleKey, $license);
            if (! $moduleCheck['allowed']) {
                return $moduleCheck;
            }
        }

        if (! Schema::hasTable('institution_semester_licenses')) {
            return $this->allow();
        }

        $plan = LicensePlan::find($license->license_plan_id);
        if (! $plan || $plan->license_type !== 'per_student_semester') {
            return $this->allow();
        }

        $semester = InstitutionSemesterLicense::query()
            ->where('institution_id', $institution->id)
            ->whereIn('status', [
                'awaiting_down_payment', 'down_payment_pending_verification',
                'down_payment_partially_paid', 'down_payment_paid', 'active',
                'awaiting_reconciliation', 'balance_due', 'partially_paid', 'paid',
                'grace_period', 'overdue', 'suspended',
            ])
            ->orderByDesc('id')
            ->first();

        if (! $semester) {
            return $this->allow('limited_setup');
        }

        if ($semester->status === 'suspended') {
            if ($moduleKey && $this->isSetupModule($moduleKey)) {
                return $this->allow('limited_setup');
            }

            return $this->deny('SEMESTER_LICENSE_SUSPENDED', 'Semester license is suspended pending payment.');
        }

        $awaitingDown = in_array($semester->status, [
            'awaiting_down_payment',
            'down_payment_pending_verification',
            'down_payment_partially_paid',
        ], true);

        if ($awaitingDown) {
            $mode = 'limited_setup';
            if ($moduleKey && ! $this->isSetupModule($moduleKey)) {
                return $this->deny(
                    'DOWN_PAYMENT_REQUIRED',
                    'Down payment must be verified before using this module.',
                    $mode
                );
            }

            return $this->allow($mode);
        }

        return $this->allow();
    }

    /**
     * @return array{allowed: bool, code: string|null, message: string|null, mode: string|null}
     */
    public function evaluateModuleLicensed(Institution $institution, string $moduleKey, ?InstitutionLicense $license = null): array
    {
        $license = $license ?: $this->currentLicense($institution);
        if (! $license || ! Schema::hasTable('institution_license_modules')) {
            return $this->allow();
        }

        $module = Module::where('key', $moduleKey)->first();
        if (! $module) {
            return $this->allow();
        }

        // Always allow core setup/billing surfaces
        if ($this->isSetupModule($moduleKey)) {
            return $this->allow();
        }

        $attached = $license->modules()->where('modules.id', $module->id)->exists();
        if (! $attached) {
            // If license has zero modules attached, treat as legacy unrestricted
            if ($license->modules()->count() === 0) {
                return $this->allow();
            }

            return $this->deny('MODULE_NOT_LICENSED', 'Module is not included in the current license.');
        }

        return $this->allow();
    }

    /**
     * @return array{allowed: bool, code: string|null, message: string|null, mode: string|null}
     */
    public function evaluateUserLimit(Institution $institution, string $kind = 'users'): array
    {
        $license = $this->currentLicense($institution);
        if (! $license) {
            return $this->allow();
        }

        if ($kind === 'students') {
            $max = $license->max_students_override;
            if ($max === null && $license->plan) {
                $max = $license->plan->max_students;
            }
            if ($max === null) {
                return $this->allow();
            }
            $current = Student::where('institution_id', $institution->id)->count();
            if ($current >= (int) $max) {
                return $this->deny('USER_LIMIT_REACHED', 'Student limit reached for this license.');
            }

            return $this->allow();
        }

        $max = $license->effectiveMaxUsers();
        if ($max === null) {
            return $this->allow();
        }

        $current = User::where('institution_id', $institution->id)->count();
        if ($current >= (int) $max) {
            return $this->deny('USER_LIMIT_REACHED', 'User limit reached for this license.');
        }

        return $this->allow();
    }

    public function currentLicense(Institution $institution): ?InstitutionLicense
    {
        if (! Schema::hasTable('institution_licenses')) {
            return null;
        }

        return InstitutionLicense::query()
            ->with('modules')
            ->where('institution_id', $institution->id)
            ->where('is_current', true)
            ->first();
    }

    protected function isSetupModule(?string $moduleKey): bool
    {
        return in_array($moduleKey, [
            'academics', 'institutions', 'users', 'roles', 'permissions', 'billing',
        ], true);
    }

    protected function allow(?string $mode = null): array
    {
        return ['allowed' => true, 'code' => null, 'message' => null, 'mode' => $mode];
    }

    protected function deny(string $code, string $message, ?string $mode = null): array
    {
        return ['allowed' => false, 'code' => $code, 'message' => $message, 'mode' => $mode];
    }
}
