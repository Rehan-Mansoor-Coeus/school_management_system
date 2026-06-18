<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateInstitutionsTableForErp extends Migration
{
    public function up()
    {
        Schema::table('institutions', function (Blueprint $table) {
            if (! Schema::hasColumn('institutions', 'type')) {
                $table->enum('type', ['university', 'college', 'school', 'vocational', 'technical', 'training'])->default('university')->after('code');
            }

            if (! Schema::hasColumn('institutions', 'logo')) {
                $table->string('logo')->nullable()->after('country');
            }
            if (! Schema::hasColumn('institutions', 'letterhead')) {
                $table->string('letterhead')->nullable()->after('logo');
            }
            if (! Schema::hasColumn('institutions', 'registrar_signature')) {
                $table->string('registrar_signature')->nullable()->after('letterhead');
            }
            if (! Schema::hasColumn('institutions', 'official_stamp')) {
                $table->string('official_stamp')->nullable()->after('registrar_signature');
            }

            foreach (['address', 'city', 'country', 'email', 'phone', 'website'] as $column) {
                if (! Schema::hasColumn('institutions', $column)) {
                    $table->string($column)->nullable();
                }
            }

            if (! Schema::hasColumn('institutions', 'currency')) {
                $table->string('currency', 10)->nullable()->after('website');
            }
            if (! Schema::hasColumn('institutions', 'timezone')) {
                $table->string('timezone', 64)->nullable()->after('currency');
            }
            if (! Schema::hasColumn('institutions', 'language')) {
                $table->enum('language', ['en', 'fr'])->default('en')->after('timezone');
            }
            if (! Schema::hasColumn('institutions', 'subscription_plan')) {
                $table->string('subscription_plan')->nullable()->after('is_active');
            }

            if (! Schema::hasColumn('institutions', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down()
    {
        Schema::table('institutions', function (Blueprint $table) {
            foreach (['type', 'logo', 'letterhead', 'registrar_signature', 'official_stamp', 'currency', 'timezone', 'language', 'subscription_plan'] as $column) {
                if (Schema::hasColumn('institutions', $column)) {
                    $table->dropColumn($column);
                }
            }
            if (Schema::hasColumn('institutions', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
}

