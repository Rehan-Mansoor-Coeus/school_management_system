<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class FixProgrammeDepartmentCodeUniques extends Migration
{
    public function up()
    {
        if (Schema::hasTable('programmes')) {
            Schema::table('programmes', function (Blueprint $table) {
                try {
                    $table->dropUnique(['code']);
                } catch (\Throwable $e) {
                    //
                }
            });

            Schema::table('programmes', function (Blueprint $table) {
                try {
                    $table->unique(['institution_id', 'code'], 'programmes_institution_code_unique');
                } catch (\Throwable $e) {
                    //
                }
            });
        }

        if (Schema::hasTable('departments')) {
            Schema::table('departments', function (Blueprint $table) {
                try {
                    $table->dropUnique(['code']);
                } catch (\Throwable $e) {
                    //
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('programmes')) {
            Schema::table('programmes', function (Blueprint $table) {
                try {
                    $table->dropUnique('programmes_institution_code_unique');
                } catch (\Throwable $e) {
                    //
                }
            });
        }
    }
}
