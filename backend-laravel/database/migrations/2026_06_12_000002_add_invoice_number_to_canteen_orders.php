<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddInvoiceNumberToCanteenOrders extends Migration
{
    public function up()
    {
        if (Schema::hasTable('canteen_orders') && ! Schema::hasColumn('canteen_orders', 'invoice_number')) {
            Schema::table('canteen_orders', function (Blueprint $table) {
                $table->string('invoice_number')->nullable()->unique()->after('order_number');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('canteen_orders') && Schema::hasColumn('canteen_orders', 'invoice_number')) {
            Schema::table('canteen_orders', function (Blueprint $table) {
                $table->dropColumn('invoice_number');
            });
        }
    }
}
