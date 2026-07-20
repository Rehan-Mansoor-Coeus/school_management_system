<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddInstitutionLinkToRegistrationRequests extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('institution_registration_requests')) {
            return;
        }

        Schema::table('institution_registration_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('institution_registration_requests', 'institution_id')) {
                $table->unsignedBigInteger('institution_id')->nullable()->after('status');
            }
            if (! Schema::hasColumn('institution_registration_requests', 'license_plan_id')) {
                $table->unsignedBigInteger('license_plan_id')->nullable()->after('institution_id');
            }
        });

        Schema::table('institution_registration_requests', function (Blueprint $table) {
            if (Schema::hasColumn('institution_registration_requests', 'institution_id')) {
                try {
                    $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('set null');
                } catch (\Throwable $e) {
                    // Foreign key may already exist.
                }
            }
            if (Schema::hasColumn('institution_registration_requests', 'license_plan_id') && Schema::hasTable('license_plans')) {
                try {
                    $table->foreign('license_plan_id')->references('id')->on('license_plans')->onDelete('set null');
                } catch (\Throwable $e) {
                    // Foreign key may already exist.
                }
            }
        });
    }

    public function down()
    {
        if (! Schema::hasTable('institution_registration_requests')) {
            return;
        }

        Schema::table('institution_registration_requests', function (Blueprint $table) {
            if (Schema::hasColumn('institution_registration_requests', 'license_plan_id')) {
                try {
                    $table->dropForeign(['license_plan_id']);
                } catch (\Throwable $e) {
                }
                $table->dropColumn('license_plan_id');
            }
            if (Schema::hasColumn('institution_registration_requests', 'institution_id')) {
                try {
                    $table->dropForeign(['institution_id']);
                } catch (\Throwable $e) {
                }
                $table->dropColumn('institution_id');
            }
        });
    }
}
