<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLicensingToInstitutionsTable extends Migration
{
    public function up()
    {
        Schema::table('institutions', function (Blueprint $table) {
            if (! Schema::hasColumn('institutions', 'subscription_status')) {
                $table->string('subscription_status', 30)->default('active')->after('subscription_plan');
            }
            if (! Schema::hasColumn('institutions', 'subscription_started_at')) {
                $table->timestamp('subscription_started_at')->nullable()->after('subscription_status');
            }
            if (! Schema::hasColumn('institutions', 'subscription_expires_at')) {
                $table->timestamp('subscription_expires_at')->nullable()->after('subscription_started_at');
            }
            if (! Schema::hasColumn('institutions', 'max_users')) {
                $table->unsignedInteger('max_users')->nullable()->after('subscription_expires_at');
            }
            if (! Schema::hasColumn('institutions', 'license_key')) {
                $table->string('license_key', 100)->nullable()->after('max_users');
            }
        });

        // Backfill sensible defaults for existing rows without touching custom plans.
        if (Schema::hasColumn('institutions', 'subscription_plan')) {
            \DB::table('institutions')
                ->whereNull('subscription_plan')
                ->update(['subscription_plan' => 'free']);
        }
    }

    public function down()
    {
        Schema::table('institutions', function (Blueprint $table) {
            foreach (['subscription_status', 'subscription_started_at', 'subscription_expires_at', 'max_users', 'license_key'] as $column) {
                if (Schema::hasColumn('institutions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}
