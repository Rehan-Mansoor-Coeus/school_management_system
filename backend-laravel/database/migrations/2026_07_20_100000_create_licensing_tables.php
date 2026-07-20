<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLicensingTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('license_plans')) {
            Schema::create('license_plans', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('name');
                $table->string('code', 80)->unique();
                $table->text('description')->nullable();
                $table->string('license_type', 40)->default('fixed_plan');
                $table->string('pricing_model', 40)->default('fixed');
                $table->string('billing_cycle', 40)->default('yearly');
                $table->string('currency', 10)->default('XAF');
                $table->decimal('base_price', 15, 2)->default(0);
                $table->decimal('setup_fee', 15, 2)->default(0);
                $table->decimal('renewal_fee', 15, 2)->default(0);
                $table->decimal('late_fee', 15, 2)->default(0);
                $table->unsignedInteger('trial_days')->default(0);
                $table->unsignedInteger('grace_period_days')->default(0);
                $table->unsignedInteger('max_users')->nullable();
                $table->unsignedInteger('max_students')->nullable();
                $table->unsignedInteger('max_teachers')->nullable();
                $table->unsignedInteger('max_staff')->nullable();
                $table->unsignedInteger('max_admins')->nullable();
                $table->unsignedBigInteger('max_storage')->nullable();
                // Per-student / semester fields (Phase 2b uses these)
                $table->decimal('price_per_student', 15, 2)->nullable();
                $table->string('student_billing_period', 40)->nullable();
                $table->unsignedInteger('minimum_billable_students')->nullable();
                $table->string('down_payment_type', 40)->nullable();
                $table->decimal('down_payment_value', 15, 2)->nullable();
                $table->decimal('minimum_down_payment', 15, 2)->nullable();
                $table->string('student_count_method', 80)->nullable();
                $table->string('student_count_lock_rule', 80)->nullable();
                $table->string('additional_student_rule', 80)->nullable();
                $table->string('withdrawn_student_rule', 80)->nullable();
                $table->string('balance_due_rule', 80)->nullable();
                $table->string('activation_rule', 80)->nullable();
                $table->boolean('count_suspended_students')->default(false);
                $table->boolean('count_deferred_students')->default(false);
                $table->boolean('count_withdrawn_students')->default(false);
                $table->boolean('count_graduated_students')->default(false);
                $table->string('status', 30)->default('active');
                $table->boolean('is_featured')->default(false);
                $table->unsignedInteger('display_order')->default(0);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'display_order']);
                $table->index('license_type');
            });
        }

        if (! Schema::hasTable('license_plan_modules')) {
            Schema::create('license_plan_modules', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('license_plan_id');
                $table->unsignedBigInteger('module_id');
                $table->timestamps();

                $table->unique(['license_plan_id', 'module_id']);
                $table->foreign('license_plan_id')->references('id')->on('license_plans')->onDelete('cascade');
                $table->foreign('module_id')->references('id')->on('modules')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('institution_licenses')) {
            Schema::create('institution_licenses', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('license_plan_id')->nullable();
                $table->string('license_type', 40)->default('fixed_plan');
                $table->string('billing_cycle', 40)->nullable();
                $table->string('currency', 10)->default('XAF');
                $table->decimal('calculated_amount', 15, 2)->nullable();
                $table->decimal('custom_amount', 15, 2)->nullable();
                $table->decimal('discount_amount', 15, 2)->default(0);
                $table->decimal('tax_amount', 15, 2)->default(0);
                $table->decimal('total_amount', 15, 2)->default(0);
                $table->decimal('amount_paid', 15, 2)->default(0);
                $table->date('start_date')->nullable();
                $table->date('expiry_date')->nullable();
                $table->date('next_billing_date')->nullable();
                $table->date('grace_period_end')->nullable();
                $table->string('license_status', 40)->default('active');
                $table->string('payment_status', 40)->default('unpaid');
                $table->boolean('auto_renew')->default(false);
                $table->boolean('is_current')->default(true);
                $table->unsignedInteger('max_users_override')->nullable();
                $table->unsignedInteger('max_students_override')->nullable();
                $table->unsignedInteger('max_teachers_override')->nullable();
                $table->unsignedInteger('max_staff_override')->nullable();
                $table->unsignedInteger('max_admins_override')->nullable();
                $table->string('license_key', 100)->nullable();
                $table->unsignedBigInteger('assigned_by')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('license_plan_id')->references('id')->on('license_plans')->onDelete('set null');
                $table->index(['institution_id', 'is_current']);
                $table->index(['license_status', 'payment_status']);
            });
        }

        if (! Schema::hasTable('institution_license_modules')) {
            Schema::create('institution_license_modules', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_license_id');
                $table->unsignedBigInteger('module_id');
                $table->decimal('unit_price', 15, 2)->nullable();
                $table->string('billing_cycle', 40)->nullable();
                $table->date('start_date')->nullable();
                $table->date('expiry_date')->nullable();
                $table->string('status', 30)->default('active');
                $table->timestamps();

                $table->unique(['institution_license_id', 'module_id'], 'ilm_license_module_unique');
                $table->foreign('institution_license_id', 'ilm_license_fk')
                    ->references('id')->on('institution_licenses')->onDelete('cascade');
                $table->foreign('module_id', 'ilm_module_fk')
                    ->references('id')->on('modules')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('billing_settings')) {
            Schema::create('billing_settings', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('default_currency', 10)->default('XAF');
                $table->string('invoice_prefix', 40)->default('OKU-INV');
                $table->string('invoice_number_format', 80)->default('{prefix}-{year}-{seq}');
                $table->string('receipt_prefix', 40)->default('OKU-RCT');
                $table->string('default_billing_cycle', 40)->default('yearly');
                $table->unsignedInteger('default_grace_period_days')->default(7);
                $table->unsignedInteger('default_payment_due_days')->default(14);
                $table->string('billing_email')->nullable();
                $table->string('billing_phone')->nullable();
                $table->text('bank_instructions')->nullable();
                $table->text('mobile_money_instructions')->nullable();
                $table->text('invoice_footer')->nullable();
                $table->text('payment_terms')->nullable();
                $table->boolean('auto_suspend_on_overdue')->default(false);
                $table->json('payment_methods')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('license_status_history')) {
            Schema::create('license_status_history', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_license_id');
                $table->string('old_status', 40)->nullable();
                $table->string('new_status', 40);
                $table->string('field', 40)->default('license_status');
                $table->text('reason')->nullable();
                $table->unsignedBigInteger('changed_by')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();

                $table->foreign('institution_license_id', 'lsh_license_fk')
                    ->references('id')->on('institution_licenses')->onDelete('cascade');
            });
        }

        if (Schema::hasTable('modules')) {
            Schema::table('modules', function (Blueprint $table) {
                if (! Schema::hasColumn('modules', 'monthly_price')) {
                    $table->decimal('monthly_price', 15, 2)->nullable()->after('is_active');
                }
                if (! Schema::hasColumn('modules', 'quarterly_price')) {
                    $table->decimal('quarterly_price', 15, 2)->nullable()->after('monthly_price');
                }
                if (! Schema::hasColumn('modules', 'six_month_price')) {
                    $table->decimal('six_month_price', 15, 2)->nullable()->after('quarterly_price');
                }
                if (! Schema::hasColumn('modules', 'yearly_price')) {
                    $table->decimal('yearly_price', 15, 2)->nullable()->after('six_month_price');
                }
                if (! Schema::hasColumn('modules', 'one_time_price')) {
                    $table->decimal('one_time_price', 15, 2)->nullable()->after('yearly_price');
                }
                if (! Schema::hasColumn('modules', 'setup_fee')) {
                    $table->decimal('setup_fee', 15, 2)->nullable()->after('one_time_price');
                }
                if (! Schema::hasColumn('modules', 'is_free')) {
                    $table->boolean('is_free')->default(false)->after('setup_fee');
                }
                if (! Schema::hasColumn('modules', 'is_mandatory')) {
                    $table->boolean('is_mandatory')->default(false)->after('is_free');
                }
                if (! Schema::hasColumn('modules', 'can_purchase_separately')) {
                    $table->boolean('can_purchase_separately')->default(true)->after('is_mandatory');
                }
                if (! Schema::hasColumn('modules', 'minimum_plan_id')) {
                    $table->unsignedBigInteger('minimum_plan_id')->nullable()->after('can_purchase_separately');
                }
                if (! Schema::hasColumn('modules', 'trial_available')) {
                    $table->boolean('trial_available')->default(false)->after('minimum_plan_id');
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('modules')) {
            Schema::table('modules', function (Blueprint $table) {
                foreach ([
                    'monthly_price', 'quarterly_price', 'six_month_price', 'yearly_price', 'one_time_price',
                    'setup_fee', 'is_free', 'is_mandatory', 'can_purchase_separately', 'minimum_plan_id', 'trial_available',
                ] as $column) {
                    if (Schema::hasColumn('modules', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        Schema::dropIfExists('license_status_history');
        Schema::dropIfExists('billing_settings');
        Schema::dropIfExists('institution_license_modules');
        Schema::dropIfExists('institution_licenses');
        Schema::dropIfExists('license_plan_modules');
        Schema::dropIfExists('license_plans');
    }
}
