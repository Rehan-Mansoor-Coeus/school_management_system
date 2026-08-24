<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddPawapayValueToPaymentsMethod extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('payments') || ! Schema::hasColumn('payments', 'payment_method')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            $column = DB::selectOne("
                SELECT data_type
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'payments'
                  AND column_name = 'payment_method'
            ");

            if ($column && $column->data_type === 'USER-DEFINED') {
                DB::statement('ALTER TABLE payments ALTER COLUMN payment_method DROP DEFAULT');
                DB::statement('ALTER TABLE payments ALTER COLUMN payment_method TYPE varchar(50) USING payment_method::text');
                DB::statement("ALTER TABLE payments ALTER COLUMN payment_method SET DEFAULT 'online'");
                DB::statement('ALTER TABLE payments ALTER COLUMN payment_method SET NOT NULL');
            }

            return;
        }

        try {
            DB::statement("ALTER TABLE payments MODIFY payment_method ENUM(
                'flutterwave', 'paystack', 'bank_transfer', 'cash', 'check', 'online', 'stripe', 'campay', 'pawapay'
            ) NOT NULL DEFAULT 'online'");
        } catch (\Exception $e) {
            // Column may already include pawapay.
        }
    }

    public function down()
    {
        // Leave payment_method as a string so later methods do not need enum updates.
    }
}
