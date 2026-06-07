<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCanteenModuleTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('canteen_meals')) {
            Schema::create('canteen_meals', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('name');
                $table->string('name_fr')->nullable();
                $table->string('code', 50)->nullable();
                $table->enum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack'])->default('lunch');
                $table->decimal('price', 10, 2)->default(0);
                $table->text('description')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->index(['institution_id', 'is_active']);
                $table->index('meal_type');
            });
        }

        if (! Schema::hasTable('canteen_feeding_plans')) {
            Schema::create('canteen_feeding_plans', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('academic_year_id')->nullable();
                $table->string('name');
                $table->string('name_fr')->nullable();
                $table->text('description')->nullable();
                $table->unsignedInteger('total_meals')->default(0);
                $table->decimal('price', 12, 2)->default(0);
                $table->date('valid_from')->nullable();
                $table->date('valid_to')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('academic_year_id')->references('id')->on('academic_years')->onDelete('set null');
                $table->index(['institution_id', 'is_active']);
            });
        }

        if (! Schema::hasTable('canteen_feeding_plan_meals')) {
            Schema::create('canteen_feeding_plan_meals', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('feeding_plan_id');
                $table->unsignedBigInteger('meal_id');
                $table->unsignedInteger('allowance')->default(0);
                $table->timestamps();

                $table->foreign('feeding_plan_id')->references('id')->on('canteen_feeding_plans')->onDelete('cascade');
                $table->foreign('meal_id')->references('id')->on('canteen_meals')->onDelete('cascade');
                $table->unique(['feeding_plan_id', 'meal_id']);
            });
        }

        if (! Schema::hasTable('canteen_wallets')) {
            Schema::create('canteen_wallets', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('student_id');
                $table->string('wallet_number')->unique();
                $table->decimal('balance', 12, 2)->default(0);
                $table->decimal('total_credit', 12, 2)->default(0);
                $table->decimal('total_spent', 12, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
                $table->unique(['institution_id', 'student_id']);
                $table->index('wallet_number');
            });
        }

        if (! Schema::hasTable('canteen_wallet_transactions')) {
            Schema::create('canteen_wallet_transactions', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('wallet_id');
                $table->enum('type', ['credit', 'debit', 'refund'])->default('credit');
                $table->decimal('amount', 12, 2);
                $table->decimal('balance_after', 12, 2)->default(0);
                $table->string('source', 50)->default('adjustment');
                $table->string('reference')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('wallet_id')->references('id')->on('canteen_wallets')->onDelete('cascade');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
                $table->index(['wallet_id', 'created_at']);
            });
        }

        if (! Schema::hasTable('canteen_subscriptions')) {
            Schema::create('canteen_subscriptions', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('student_id');
                $table->unsignedBigInteger('feeding_plan_id');
                $table->unsignedBigInteger('wallet_id')->nullable();
                $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
                $table->unsignedInteger('meals_remaining')->default(0);
                $table->unsignedInteger('meals_used')->default(0);
                $table->decimal('amount_paid', 12, 2)->default(0);
                $table->timestamp('subscribed_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
                $table->foreign('feeding_plan_id')->references('id')->on('canteen_feeding_plans')->onDelete('cascade');
                $table->foreign('wallet_id')->references('id')->on('canteen_wallets')->onDelete('set null');
                $table->index(['institution_id', 'student_id', 'status']);
            });
        }

        if (! Schema::hasTable('canteen_meal_attendance')) {
            Schema::create('canteen_meal_attendance', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('student_id');
                $table->unsignedBigInteger('meal_id');
                $table->unsignedBigInteger('subscription_id')->nullable();
                $table->unsignedBigInteger('wallet_transaction_id')->nullable();
                $table->timestamp('served_at');
                $table->enum('verification_method', ['qr', 'id', 'wallet'])->default('qr');
                $table->unsignedBigInteger('verified_by')->nullable();
                $table->decimal('amount_charged', 10, 2)->default(0);
                $table->enum('payment_source', ['wallet', 'subscription', 'free'])->default('wallet');
                $table->enum('status', ['served', 'void'])->default('served');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
                $table->foreign('meal_id')->references('id')->on('canteen_meals')->onDelete('cascade');
                $table->foreign('subscription_id')->references('id')->on('canteen_subscriptions')->onDelete('set null');
                $table->foreign('wallet_transaction_id')->references('id')->on('canteen_wallet_transactions')->onDelete('set null');
                $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');
                $table->index(['institution_id', 'served_at']);
                $table->index(['student_id', 'served_at']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('canteen_meal_attendance');
        Schema::dropIfExists('canteen_subscriptions');
        Schema::dropIfExists('canteen_wallet_transactions');
        Schema::dropIfExists('canteen_feeding_plan_meals');
        Schema::dropIfExists('canteen_feeding_plans');
        Schema::dropIfExists('canteen_meals');
    }
}
