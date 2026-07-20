<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSemesterLicensingAndBillingTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('institution_semester_licenses')) {
            Schema::create('institution_semester_licenses', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('institution_license_id')->nullable();
                $table->unsignedBigInteger('license_plan_id')->nullable();
                $table->unsignedBigInteger('academic_year_id');
                $table->unsignedBigInteger('semester_id')->nullable();
                $table->string('semester_name', 40)->nullable();
                $table->string('currency', 10)->default('XAF');
                $table->decimal('price_per_student', 15, 2)->default(0);
                $table->unsignedInteger('minimum_billable_students')->default(0);
                $table->unsignedInteger('estimated_students')->default(0);
                $table->unsignedInteger('projected_students')->default(0);
                $table->unsignedInteger('locked_students')->nullable();
                $table->decimal('estimated_total', 15, 2)->default(0);
                $table->decimal('required_down_payment', 15, 2)->default(0);
                $table->decimal('down_payment_paid', 15, 2)->default(0);
                $table->decimal('locked_total', 15, 2)->nullable();
                $table->decimal('balance_due', 15, 2)->default(0);
                $table->decimal('amount_paid', 15, 2)->default(0);
                $table->string('status', 60)->default('draft');
                $table->string('payment_status', 40)->default('unpaid');
                $table->date('student_count_lock_date')->nullable();
                $table->timestamp('locked_at')->nullable();
                $table->timestamp('reconciled_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['institution_id', 'academic_year_id', 'semester_name'], 'isl_inst_year_sem_unique');
                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('institution_license_id')->references('id')->on('institution_licenses')->onDelete('set null');
                $table->foreign('license_plan_id')->references('id')->on('license_plans')->onDelete('set null');
                $table->foreign('academic_year_id')->references('id')->on('academic_years')->onDelete('cascade');
                $table->index(['status', 'payment_status']);
            });
        }

        if (! Schema::hasTable('semester_license_student_usage')) {
            Schema::create('semester_license_student_usage', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_semester_license_id');
                $table->unsignedBigInteger('student_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('status', 40)->default('active');
                $table->boolean('is_billable')->default(true);
                $table->boolean('added_after_lock')->default(false);
                $table->timestamp('first_seen_at')->nullable();
                $table->timestamp('removed_at')->nullable();
                $table->timestamps();

                $table->unique(['institution_semester_license_id', 'student_id'], 'slsu_unique');
                $table->foreign('institution_semester_license_id', 'slsu_isl_fk')
                    ->references('id')->on('institution_semester_licenses')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('semester_license_count_snapshots')) {
            Schema::create('semester_license_count_snapshots', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_semester_license_id');
                $table->string('snapshot_type', 40);
                $table->unsignedInteger('student_count')->default(0);
                $table->unsignedInteger('billable_count')->default(0);
                $table->decimal('amount', 15, 2)->default(0);
                $table->text('reason')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_semester_license_id', 'slcs_isl_fk')
                    ->references('id')->on('institution_semester_licenses')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('semester_license_adjustments')) {
            Schema::create('semester_license_adjustments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_semester_license_id');
                $table->string('adjustment_type', 60);
                $table->decimal('amount', 15, 2)->default(0);
                $table->integer('quantity')->default(0);
                $table->text('reason')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_semester_license_id', 'sla_isl_fk')
                    ->references('id')->on('institution_semester_licenses')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('license_invoices')) {
            Schema::create('license_invoices', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('institution_license_id')->nullable();
                $table->unsignedBigInteger('institution_semester_license_id')->nullable();
                $table->string('invoice_number', 80)->unique();
                $table->string('invoice_type', 40)->default('license');
                $table->string('currency', 10)->default('XAF');
                $table->decimal('subtotal', 15, 2)->default(0);
                $table->decimal('tax_amount', 15, 2)->default(0);
                $table->decimal('discount_amount', 15, 2)->default(0);
                $table->decimal('total_amount', 15, 2)->default(0);
                $table->decimal('amount_paid', 15, 2)->default(0);
                $table->string('status', 40)->default('draft');
                $table->date('issue_date')->nullable();
                $table->date('due_date')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->index(['institution_id', 'status']);
            });
        }

        if (! Schema::hasTable('license_invoice_items')) {
            Schema::create('license_invoice_items', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('license_invoice_id');
                $table->string('item_type', 60);
                $table->string('description');
                $table->unsignedInteger('quantity')->default(1);
                $table->decimal('unit_price', 15, 2)->default(0);
                $table->decimal('line_total', 15, 2)->default(0);
                $table->timestamps();

                $table->foreign('license_invoice_id', 'lii_invoice_fk')
                    ->references('id')->on('license_invoices')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('license_payments')) {
            Schema::create('license_payments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('license_invoice_id')->nullable();
                $table->unsignedBigInteger('institution_semester_license_id')->nullable();
                $table->string('payment_number', 80)->nullable();
                $table->string('currency', 10)->default('XAF');
                $table->decimal('amount', 15, 2)->default(0);
                $table->string('method', 40)->default('manual');
                $table->string('status', 40)->default('pending');
                $table->string('reference')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('recorded_by')->nullable();
                $table->unsignedBigInteger('verified_by')->nullable();
                $table->timestamp('verified_at')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->index(['status', 'institution_id']);
            });
        }

        if (! Schema::hasTable('license_payment_proofs')) {
            Schema::create('license_payment_proofs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('license_payment_id');
                $table->string('file_path');
                $table->string('original_name')->nullable();
                $table->string('status', 40)->default('pending');
                $table->text('rejection_reason')->nullable();
                $table->unsignedBigInteger('uploaded_by')->nullable();
                $table->unsignedBigInteger('reviewed_by')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();

                $table->foreign('license_payment_id', 'lpp_payment_fk')
                    ->references('id')->on('license_payments')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('payment_allocations')) {
            Schema::create('payment_allocations', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('license_payment_id');
                $table->unsignedBigInteger('license_invoice_id')->nullable();
                $table->unsignedBigInteger('institution_semester_license_id')->nullable();
                $table->string('allocation_type', 60)->default('general');
                $table->decimal('amount', 15, 2)->default(0);
                $table->timestamps();

                $table->foreign('license_payment_id', 'pa_payment_fk')
                    ->references('id')->on('license_payments')->onDelete('cascade');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('license_payment_proofs');
        Schema::dropIfExists('license_payments');
        Schema::dropIfExists('license_invoice_items');
        Schema::dropIfExists('license_invoices');
        Schema::dropIfExists('semester_license_adjustments');
        Schema::dropIfExists('semester_license_count_snapshots');
        Schema::dropIfExists('semester_license_student_usage');
        Schema::dropIfExists('institution_semester_licenses');
    }
}
