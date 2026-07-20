<?php

use App\Institution;
use App\Modules\Licensing\Models\BillingSetting;
use App\Modules\Licensing\Models\LicensePlan;
use App\Modules\Licensing\Services\InstitutionLicenseService;
use App\Permission;
use App\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;

class LicensePlansSeeder extends Seeder
{
    public function run()
    {
        if (! Schema::hasTable('license_plans')) {
            $this->command->warn('license_plans table missing — run migrations first.');

            return;
        }

        $this->seedPermissions();
        $this->seedPlans();
        BillingSetting::current();
        $this->backfillInstitutionLicenses();
    }

    protected function seedPermissions(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $names = [
            'view_license_dashboard',
            'view_license_plans',
            'create_license_plans',
            'edit_license_plans',
            'archive_license_plans',
            'manage_module_pricing',
            'assign_institution_licenses',
            'modify_institution_licenses',
            'view_license_invoices',
            'create_license_invoices',
            'cancel_license_invoices',
            'view_license_payments',
            'record_license_payments',
            'verify_license_payments',
            'reject_license_payments',
            'refund_license_payments',
            'renew_institution_licenses',
            'suspend_institution_licenses',
            'reactivate_institution_licenses',
            'manage_license_discounts',
            'manage_billing_settings',
            'view_license_reports',
        ];

        foreach ($names as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'api']);
        }

        foreach (['super-admin', 'system-super-admin'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'api')->first();
            if ($role) {
                $role->givePermissionTo($names);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    protected function seedPlans(): void
    {
        $defaults = [
            [
                'name' => 'Free Plan',
                'code' => 'free',
                'description' => 'Entry-level plan for evaluation and small institutions.',
                'license_type' => 'free',
                'pricing_model' => 'fixed',
                'billing_cycle' => 'yearly',
                'base_price' => 0,
                'max_users' => 25,
                'max_students' => 100,
                'display_order' => 1,
                'is_featured' => false,
            ],
            [
                'name' => 'Basic Plan',
                'code' => 'basic',
                'description' => 'Core academic and student management features.',
                'license_type' => 'fixed_plan',
                'pricing_model' => 'fixed',
                'billing_cycle' => 'yearly',
                'base_price' => 0,
                'max_users' => 100,
                'max_students' => 500,
                'display_order' => 2,
                'is_featured' => false,
            ],
            [
                'name' => 'Standard Plan',
                'code' => 'standard',
                'description' => 'Standard institutional package with broader module access.',
                'license_type' => 'fixed_plan',
                'pricing_model' => 'fixed',
                'billing_cycle' => 'yearly',
                'base_price' => 0,
                'max_users' => 250,
                'max_students' => 2000,
                'display_order' => 3,
                'is_featured' => true,
            ],
            [
                'name' => 'Premium Plan',
                'code' => 'premium',
                'description' => 'Premium package for growing institutions.',
                'license_type' => 'fixed_plan',
                'pricing_model' => 'fixed',
                'billing_cycle' => 'yearly',
                'base_price' => 0,
                'max_users' => 500,
                'max_students' => 5000,
                'display_order' => 4,
                'is_featured' => true,
            ],
            [
                'name' => 'Enterprise Plan',
                'code' => 'enterprise',
                'description' => 'Enterprise package with highest limits and custom support.',
                'license_type' => 'fixed_plan',
                'pricing_model' => 'fixed',
                'billing_cycle' => 'yearly',
                'base_price' => 0,
                'max_users' => null,
                'max_students' => null,
                'display_order' => 5,
                'is_featured' => false,
            ],
        ];

        foreach ($defaults as $row) {
            LicensePlan::updateOrCreate(
                ['code' => $row['code']],
                array_merge($row, [
                    'currency' => 'XAF',
                    'status' => 'active',
                    'grace_period_days' => 7,
                ])
            );
        }
    }

    protected function backfillInstitutionLicenses(): void
    {
        if (! Schema::hasTable('institution_licenses') || ! Schema::hasTable('institutions')) {
            return;
        }

        $service = app(InstitutionLicenseService::class);
        $count = 0;

        Institution::query()->orderBy('id')->chunk(50, function ($institutions) use ($service, &$count) {
            foreach ($institutions as $institution) {
                $service->ensureFromLegacy($institution);
                $count++;
            }
        });

        if ($this->command) {
            $this->command->info("Backfilled current licenses for {$count} institution(s).");
        }
    }
}
