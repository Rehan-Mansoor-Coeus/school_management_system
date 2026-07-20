<?php

namespace App\Modules\Licensing\Services;

use App\Institution;
use App\Modules\Licensing\Models\InstitutionLicense;
use App\Modules\Licensing\Models\LicensePlan;
use App\Modules\Licensing\Models\LicenseStatusHistory;
use App\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InstitutionLicenseService
{
    /**
     * Current license for an institution, creating a backfill record if missing.
     */
    public function currentFor(Institution $institution): ?InstitutionLicense
    {
        if (! Schema::hasTable('institution_licenses')) {
            return null;
        }

        $license = InstitutionLicense::query()
            ->with(['plan', 'modules'])
            ->where('institution_id', $institution->id)
            ->where('is_current', true)
            ->latest('id')
            ->first();

        if ($license) {
            return $license;
        }

        return $this->ensureFromLegacy($institution);
    }

    public function ensureFromLegacy(Institution $institution): ?InstitutionLicense
    {
        if (! Schema::hasTable('institution_licenses') || ! Schema::hasTable('license_plans')) {
            return null;
        }

        $planCode = $institution->subscription_plan ?: 'free';
        $plan = LicensePlan::where('code', $planCode)->first()
            ?: LicensePlan::where('code', 'free')->first();

        $licenseStatus = $this->mapLegacyStatus($institution->subscription_status);
        $paymentStatus = in_array($licenseStatus, ['active', 'trial'], true) || ($plan && $plan->license_type === 'free')
            ? 'paid'
            : 'unpaid';

        return DB::transaction(function () use ($institution, $plan, $licenseStatus, $paymentStatus) {
            InstitutionLicense::where('institution_id', $institution->id)
                ->where('is_current', true)
                ->update(['is_current' => false]);

            $license = InstitutionLicense::create([
                'institution_id' => $institution->id,
                'license_plan_id' => $plan ? $plan->id : null,
                'license_type' => $plan ? $plan->license_type : 'fixed_plan',
                'billing_cycle' => $plan ? $plan->billing_cycle : 'yearly',
                'currency' => $plan ? $plan->currency : ($institution->currency ?: 'XAF'),
                'total_amount' => $plan ? (float) $plan->base_price : 0,
                'amount_paid' => $paymentStatus === 'paid' ? (float) optional($plan)->base_price : 0,
                'start_date' => optional($institution->subscription_started_at)->toDateString() ?: now()->toDateString(),
                'expiry_date' => optional($institution->subscription_expires_at)->toDateString(),
                'license_status' => $licenseStatus,
                'payment_status' => $paymentStatus,
                'is_current' => true,
                'max_users_override' => $institution->max_users,
                'license_key' => $institution->license_key,
            ]);

            $this->syncModulesFromInstitution($license, $institution);
            $this->syncLegacyColumns($institution, $license);

            return $license->fresh(['plan', 'modules']);
        });
    }

    public function assignOrUpdate(
        Institution $institution,
        array $data,
        ?int $userId = null,
        ?string $ip = null
    ): InstitutionLicense {
        $plan = null;
        if (! empty($data['license_plan_id'])) {
            $plan = LicensePlan::findOrFail($data['license_plan_id']);
        } elseif (! empty($data['plan_code'])) {
            $plan = LicensePlan::where('code', $data['plan_code'])->firstOrFail();
        }

        return DB::transaction(function () use ($institution, $data, $plan, $userId, $ip) {
            $current = InstitutionLicense::query()
                ->where('institution_id', $institution->id)
                ->where('is_current', true)
                ->first();

            $payload = [
                'license_plan_id' => $plan ? $plan->id : optional($current)->license_plan_id,
                'license_type' => $plan ? $plan->license_type : (optional($current)->license_type ?: 'fixed_plan'),
                'billing_cycle' => $data['billing_cycle'] ?? ($plan ? $plan->billing_cycle : optional($current)->billing_cycle),
                'currency' => $data['currency'] ?? ($plan ? $plan->currency : (optional($current)->currency ?: 'XAF')),
                'start_date' => $data['start_date'] ?? optional($current)->start_date,
                'expiry_date' => array_key_exists('expiry_date', $data) ? $data['expiry_date'] : optional($current)->expiry_date,
                'next_billing_date' => $data['next_billing_date'] ?? optional($current)->next_billing_date,
                'grace_period_end' => $data['grace_period_end'] ?? optional($current)->grace_period_end,
                'license_status' => $data['license_status'] ?? optional($current)->license_status ?? 'active',
                'payment_status' => $data['payment_status'] ?? optional($current)->payment_status ?? 'unpaid',
                'auto_renew' => array_key_exists('auto_renew', $data) ? (bool) $data['auto_renew'] : (bool) optional($current)->auto_renew,
                'max_users_override' => array_key_exists('max_users_override', $data)
                    ? $data['max_users_override']
                    : optional($current)->max_users_override,
                'max_students_override' => $data['max_students_override'] ?? optional($current)->max_students_override,
                'license_key' => array_key_exists('license_key', $data) ? $data['license_key'] : optional($current)->license_key,
                'total_amount' => $data['total_amount'] ?? ($plan ? $plan->base_price : optional($current)->total_amount),
                'amount_paid' => $data['amount_paid'] ?? optional($current)->amount_paid ?? 0,
                'is_current' => true,
                'assigned_by' => $userId,
                'notes' => $data['notes'] ?? optional($current)->notes,
            ];

            // Empty strings clear nullable dates/limits.
            foreach (['expiry_date', 'start_date', 'next_billing_date', 'grace_period_end', 'max_users_override', 'license_key'] as $nullable) {
                if (array_key_exists($nullable, $payload) && $payload[$nullable] === '') {
                    $payload[$nullable] = null;
                }
            }

            if ($current && empty($data['create_new_period'])) {
                $oldStatus = $current->license_status;
                $current->update($payload);
                $license = $current->fresh(['plan', 'modules']);

                if ($oldStatus !== $license->license_status) {
                    $this->recordStatusChange($license, $oldStatus, $license->license_status, 'license_status', $data['reason'] ?? null, $userId, $ip);
                }
            } else {
                InstitutionLicense::where('institution_id', $institution->id)
                    ->where('is_current', true)
                    ->update(['is_current' => false]);

                $license = InstitutionLicense::create(array_merge($payload, [
                    'institution_id' => $institution->id,
                ]))->fresh(['plan', 'modules']);

                $this->recordStatusChange($license, null, $license->license_status, 'license_status', $data['reason'] ?? 'Assigned', $userId, $ip);
            }

            if (array_key_exists('module_ids', $data) && is_array($data['module_ids'])) {
                $sync = [];
                foreach ($data['module_ids'] as $moduleId) {
                    $sync[$moduleId] = ['status' => 'active'];
                }
                $license->modules()->sync($sync);
            } elseif ($plan && $plan->modules()->exists() && (! $current || ! empty($data['sync_plan_modules']))) {
                $sync = [];
                foreach ($plan->modules()->pluck('modules.id') as $moduleId) {
                    $sync[$moduleId] = ['status' => 'active'];
                }
                $license->modules()->sync($sync);
            }

            if (array_key_exists('is_active', $data)) {
                $institution->is_active = (bool) $data['is_active'];
                $institution->save();
            }

            $this->syncLegacyColumns($institution->fresh(), $license->fresh(['plan', 'modules']));

            return $license->fresh(['plan', 'modules']);
        });
    }

    public function toCurrentLicensePayload(Institution $institution, ?InstitutionLicense $license = null): array
    {
        $license = $license ?: $this->currentFor($institution);
        $plan = $license ? $license->plan : null;
        $expiresAt = $license && $license->expiry_date
            ? Carbon::parse($license->expiry_date)
            : $institution->subscription_expires_at;
        $daysRemaining = $expiresAt
            ? Carbon::now()->startOfDay()->diffInDays($expiresAt->copy()->startOfDay(), false)
            : null;

        $maxUsers = $license ? $license->effectiveMaxUsers() : $institution->max_users;
        $currentUsers = User::where('institution_id', $institution->id)->count();
        $currentStudents = User::where('institution_id', $institution->id)
            ->whereHas('roles', function ($q) {
                $q->where('name', 'student');
            })
            ->count();

        $modules = [];
        if ($license && $license->relationLoaded('modules')) {
            $modules = $license->modules->map(function ($m) {
                return [
                    'id' => $m->id,
                    'key' => $m->key,
                    'name' => $m->name,
                    'status' => $m->pivot->status ?? 'active',
                ];
            })->values()->all();
        }

        $total = $license ? (float) $license->total_amount : 0;
        $paid = $license ? (float) $license->amount_paid : 0;

        return [
            'id' => $license ? $license->id : null,
            'plan' => $plan ? [
                'id' => $plan->id,
                'name' => $plan->name,
                'code' => $plan->code,
                'license_type' => $plan->license_type,
                'billing_cycle' => $plan->billing_cycle,
                'currency' => $plan->currency,
            ] : [
                'id' => null,
                'name' => ucfirst($institution->subscription_plan ?: 'free'),
                'code' => $institution->subscription_plan ?: 'free',
                'license_type' => 'fixed_plan',
                'billing_cycle' => 'yearly',
                'currency' => $institution->currency ?: 'XAF',
            ],
            'license_type' => $license ? $license->license_type : 'fixed_plan',
            'billing_cycle' => $license ? $license->billing_cycle : 'yearly',
            'license_status' => $license ? $license->license_status : ($institution->subscription_status ?: 'active'),
            'payment_status' => $license ? $license->payment_status : 'paid',
            'start_date' => $license && $license->start_date
                ? $license->start_date->toDateString()
                : optional($institution->subscription_started_at)->toDateString(),
            'expiry_date' => $expiresAt ? $expiresAt->toDateString() : null,
            'next_billing_date' => $license && $license->next_billing_date
                ? $license->next_billing_date->toDateString()
                : null,
            'grace_period_end' => $license && $license->grace_period_end
                ? $license->grace_period_end->toDateString()
                : null,
            'max_users' => $maxUsers,
            'current_users' => $currentUsers,
            'max_students' => $license
                ? ($license->max_students_override ?? optional($plan)->max_students)
                : null,
            'current_students' => $currentStudents,
            'total_amount' => $total,
            'amount_paid' => $paid,
            'balance' => max(0, $total - $paid),
            'currency' => $license ? $license->currency : ($institution->currency ?: 'XAF'),
            'license_key' => $license ? $license->license_key : $institution->license_key,
            'auto_renew' => $license ? (bool) $license->auto_renew : false,
            'is_expired' => $expiresAt ? $expiresAt->isPast() : false,
            'days_remaining' => $daysRemaining,
            'enabled_modules' => $modules,
            // Legacy aliases for existing frontend
            'plan_code' => $plan ? $plan->code : ($institution->subscription_plan ?: 'free'),
            'status' => $license ? $license->license_status : ($institution->subscription_status ?: 'active'),
            'plan_name' => $plan ? $plan->name : ucfirst($institution->subscription_plan ?: 'free'),
            'started_at' => $license && $license->start_date
                ? $license->start_date->toDateString()
                : optional($institution->subscription_started_at)->toDateString(),
            'expires_at' => $expiresAt ? $expiresAt->toDateString() : null,
        ];
    }

    /**
     * Plans that collect money only after student counts are known (or are free)
     * should not block activation in the onboarding Pending Payment queue.
     */
    public function requiresUpfrontPayment(?LicensePlan $plan): bool
    {
        if (! $plan) {
            return true;
        }

        return ! in_array($plan->license_type, ['free', 'per_student_semester'], true);
    }

    /**
     * Record a (possibly partial) payment against the current license.
     * When balance reaches zero, activates the license.
     */
    public function recordPayment(
        Institution $institution,
        float $amount,
        ?string $note = null,
        ?int $userId = null,
        ?string $ip = null
    ): InstitutionLicense {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Payment amount must be greater than zero.');
        }

        return DB::transaction(function () use ($institution, $amount, $note, $userId, $ip) {
            $license = $this->currentFor($institution);
            if (! $license) {
                throw new \RuntimeException('No current license found for this institution.');
            }

            $total = (float) $license->total_amount;
            $paid = (float) $license->amount_paid + $amount;
            if ($total > 0 && $paid > $total + 0.0001) {
                $paid = $total;
            }

            $balance = max(0, $total - $paid);
            $oldStatus = $license->license_status;
            $oldPayment = $license->payment_status;

            $paymentStatus = $balance <= 0 ? 'paid' : 'partially_paid';
            $licenseStatus = $balance <= 0 ? 'active' : ($oldStatus === 'pending_payment' ? 'pending_payment' : $oldStatus);

            $paymentLine = 'Payment '.now()->toDateTimeString().': '.$amount
                .($note ? ' — '.$note : '');
            $notes = trim(implode("\n", array_filter([(string) $license->notes, $paymentLine])));

            $license->update([
                'amount_paid' => $paid,
                'payment_status' => $paymentStatus,
                'license_status' => $licenseStatus,
                'notes' => $notes,
            ]);

            $license = $license->fresh(['plan', 'modules']);

            if ($oldStatus !== $license->license_status) {
                $this->recordStatusChange($license, $oldStatus, $license->license_status, 'license_status', $note ?: 'Payment recorded', $userId, $ip);
            }
            if ($oldPayment !== $license->payment_status) {
                $this->recordStatusChange($license, $oldPayment, $license->payment_status, 'payment_status', $note ?: 'Payment recorded', $userId, $ip);
            }

            $this->syncLegacyColumns($institution->fresh(), $license);

            return $license;
        });
    }

    public function listInstitutionLicenses(array $filters = [])
    {
        $query = InstitutionLicense::query()
            ->with(['plan', 'institution'])
            ->where('is_current', true)
            ->orderByDesc('updated_at');

        if (! empty($filters['license_status'])) {
            $query->where('license_status', $filters['license_status']);
        }
        if (! empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }
        if (! empty($filters['license_type'])) {
            $query->where('license_type', $filters['license_type']);
        }
        if (! empty($filters['plan_id'])) {
            $query->where('license_plan_id', $filters['plan_id']);
        }
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->whereHas('institution', function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('code', 'like', '%'.$search.'%');
            });
        }

        return $query->get();
    }

    public function syncLegacyColumns(Institution $institution, InstitutionLicense $license): void
    {
        $planCode = optional($license->plan)->code ?: $institution->subscription_plan ?: 'free';

        $institution->forceFill([
            'subscription_plan' => $planCode,
            'subscription_status' => $this->toLegacyStatus($license->license_status),
            'subscription_started_at' => $license->start_date,
            'subscription_expires_at' => $license->expiry_date,
            'max_users' => $license->effectiveMaxUsers(),
            'license_key' => $license->license_key,
        ])->save();
    }

    protected function syncModulesFromInstitution(InstitutionLicense $license, Institution $institution): void
    {
        if (! Schema::hasTable('institution_modules')) {
            return;
        }

        $moduleIds = DB::table('institution_modules')
            ->where('institution_id', $institution->id)
            ->where('enabled', true)
            ->pluck('module_id')
            ->all();

        if (empty($moduleIds)) {
            return;
        }

        $sync = [];
        foreach ($moduleIds as $moduleId) {
            $sync[$moduleId] = ['status' => 'active'];
        }
        $license->modules()->sync($sync);
    }

    protected function recordStatusChange(
        InstitutionLicense $license,
        ?string $old,
        string $new,
        string $field,
        ?string $reason,
        ?int $userId,
        ?string $ip
    ): void {
        if (! Schema::hasTable('license_status_history')) {
            return;
        }

        LicenseStatusHistory::create([
            'institution_license_id' => $license->id,
            'old_status' => $old,
            'new_status' => $new,
            'field' => $field,
            'reason' => $reason,
            'changed_by' => $userId,
            'ip_address' => $ip,
        ]);
    }

    protected function mapLegacyStatus(?string $status): string
    {
        $status = $status ?: 'active';
        $allowed = ['draft', 'trial', 'pending_payment', 'pending_activation', 'active', 'grace_period', 'overdue', 'expired', 'suspended', 'cancelled', 'terminated'];

        return in_array($status, $allowed, true) ? $status : 'active';
    }

    protected function toLegacyStatus(string $status): string
    {
        if (in_array($status, ['active', 'trial', 'suspended', 'expired', 'pending_payment', 'grace_period', 'overdue', 'draft'], true)) {
            return $status;
        }

        if (in_array($status, ['cancelled', 'terminated'], true)) {
            return 'suspended';
        }

        return 'active';
    }
}
