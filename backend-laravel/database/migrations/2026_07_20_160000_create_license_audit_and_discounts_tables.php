<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLicenseAuditAndDiscountsTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('license_audit_logs')) {
            Schema::create('license_audit_logs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->nullable()->index();
                $table->unsignedBigInteger('institution_license_id')->nullable()->index();
                $table->unsignedBigInteger('institution_semester_license_id')->nullable()->index();
                $table->unsignedBigInteger('license_plan_id')->nullable()->index();
                $table->string('entity_type', 80);
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->string('action', 80);
                $table->string('field', 80)->nullable();
                $table->text('old_value')->nullable();
                $table->text('new_value')->nullable();
                $table->text('reason')->nullable();
                $table->json('meta')->nullable();
                $table->unsignedBigInteger('acted_by')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('license_discounts')) {
            Schema::create('license_discounts', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->nullable()->index();
                $table->unsignedBigInteger('institution_license_id')->nullable()->index();
                $table->unsignedBigInteger('institution_semester_license_id')->nullable()->index();
                $table->unsignedBigInteger('license_invoice_id')->nullable()->index();
                $table->string('discount_type', 40)->default('fixed'); // fixed | percentage
                $table->decimal('amount', 15, 2)->default(0);
                $table->string('currency', 10)->default('XAF');
                $table->string('status', 40)->default('active');
                $table->string('reason', 1000)->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('license_taxes')) {
            Schema::create('license_taxes', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('name', 120);
                $table->string('code', 40)->nullable();
                $table->decimal('rate', 8, 4)->default(0);
                $table->boolean('is_inclusive')->default(false);
                $table->boolean('is_active')->default(true);
                $table->string('currency', 10)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('license_taxes');
        Schema::dropIfExists('license_discounts');
        Schema::dropIfExists('license_audit_logs');
    }
}
