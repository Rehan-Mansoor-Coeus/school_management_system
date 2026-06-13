<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCanteenPosOrders extends Migration
{
    public function up()
    {
        if (Schema::hasTable('canteen_wallets')) {
            Schema::table('canteen_wallets', function (Blueprint $table) {
                if (! Schema::hasColumn('canteen_wallets', 'credit_limit')) {
                    $table->decimal('credit_limit', 12, 2)->default(0)->after('total_spent');
                }
                if (! Schema::hasColumn('canteen_wallets', 'credit_used')) {
                    $table->decimal('credit_used', 12, 2)->default(0)->after('credit_limit');
                }
                if (! Schema::hasColumn('canteen_wallets', 'deposit_balance')) {
                    $table->decimal('deposit_balance', 12, 2)->default(0)->after('credit_used');
                }
            });
        }

        if (! Schema::hasTable('canteen_orders')) {
            Schema::create('canteen_orders', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('student_id')->nullable();
                $table->string('order_number')->unique();
                $table->decimal('subtotal', 12, 2)->default(0);
                $table->decimal('subscription_credit', 12, 2)->default(0);
                $table->decimal('total', 12, 2)->default(0);
                $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
                $table->enum('payment_status', ['paid', 'pending', 'failed'])->default('pending');
                $table->string('payment_method', 30)->nullable();
                $table->unsignedBigInteger('served_by')->nullable();
                $table->text('notes')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('student_id')->references('id')->on('students')->onDelete('set null');
                $table->foreign('served_by')->references('id')->on('users')->onDelete('set null');
                $table->index(['institution_id', 'created_at']);
            });
        }

        if (! Schema::hasTable('canteen_order_items')) {
            Schema::create('canteen_order_items', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('order_id');
                $table->unsignedBigInteger('meal_id');
                $table->unsignedInteger('quantity')->default(1);
                $table->decimal('unit_price', 10, 2)->default(0);
                $table->decimal('line_total', 12, 2)->default(0);
                $table->decimal('subscription_credit', 10, 2)->default(0);
                $table->string('payment_source', 30)->nullable();
                $table->unsignedBigInteger('subscription_id')->nullable();
                $table->timestamps();

                $table->foreign('order_id')->references('id')->on('canteen_orders')->onDelete('cascade');
                $table->foreign('meal_id')->references('id')->on('canteen_meals')->onDelete('cascade');
                $table->foreign('subscription_id')->references('id')->on('canteen_subscriptions')->onDelete('set null');
            });
        }

        if (! Schema::hasTable('canteen_order_payments')) {
            Schema::create('canteen_order_payments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('order_id');
                $table->unsignedBigInteger('institution_id');
                $table->string('method', 30);
                $table->decimal('amount', 12, 2);
                $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
                $table->string('reference')->nullable();
                $table->string('gateway', 30)->nullable();
                $table->string('gateway_reference')->nullable();
                $table->json('metadata')->nullable();
                $table->unsignedBigInteger('wallet_transaction_id')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();

                $table->foreign('order_id')->references('id')->on('canteen_orders')->onDelete('cascade');
                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('wallet_transaction_id')->references('id')->on('canteen_wallet_transactions')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
                $table->index(['order_id', 'status']);
            });
        }

        if (Schema::hasTable('canteen_meal_attendance') && ! Schema::hasColumn('canteen_meal_attendance', 'order_id')) {
            Schema::table('canteen_meal_attendance', function (Blueprint $table) {
                $table->unsignedBigInteger('order_id')->nullable()->after('wallet_transaction_id');
                $table->foreign('order_id')->references('id')->on('canteen_orders')->onDelete('set null');
            });
        }

        if (Schema::hasTable('canteen_meal_attendance') && ! Schema::hasColumn('canteen_meal_attendance', 'pos_payment_method')) {
            Schema::table('canteen_meal_attendance', function (Blueprint $table) {
                $table->string('pos_payment_method', 30)->nullable()->after('payment_source');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('canteen_meal_attendance') && Schema::hasColumn('canteen_meal_attendance', 'order_id')) {
            Schema::table('canteen_meal_attendance', function (Blueprint $table) {
                $table->dropForeign(['order_id']);
                $table->dropColumn('order_id');
            });
        }

        Schema::dropIfExists('canteen_order_payments');
        Schema::dropIfExists('canteen_order_items');
        Schema::dropIfExists('canteen_orders');

        if (Schema::hasTable('canteen_wallets')) {
            Schema::table('canteen_wallets', function (Blueprint $table) {
                foreach (['credit_limit', 'credit_used', 'deposit_balance'] as $column) {
                    if (Schema::hasColumn('canteen_wallets', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
}
