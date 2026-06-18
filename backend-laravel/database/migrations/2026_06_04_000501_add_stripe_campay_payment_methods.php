<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddStripeCampayPaymentMethods extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('payments')) {
            return;
        }

        try {
            DB::statement("ALTER TABLE payments MODIFY payment_method ENUM(
                'flutterwave', 'paystack', 'bank_transfer', 'cash', 'check', 'online', 'stripe', 'campay'
            ) NOT NULL DEFAULT 'online'");
        } catch (\Exception $e) {
            // Column may already include new values.
        }
    }

    public function down()
    {
        if (! Schema::hasTable('payments')) {
            return;
        }

        try {
            DB::statement("ALTER TABLE payments MODIFY payment_method ENUM(
                'flutterwave', 'paystack', 'bank_transfer', 'cash', 'check', 'online'
            ) NOT NULL DEFAULT 'online'");
        } catch (\Exception $e) {
        }
    }
}
