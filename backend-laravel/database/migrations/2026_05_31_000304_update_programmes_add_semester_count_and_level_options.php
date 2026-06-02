<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class UpdateProgrammesAddSemesterCountAndLevelOptions extends Migration
{
    public function up()
    {
        Schema::table('programmes', function (Blueprint $table) {
            if (! Schema::hasColumn('programmes', 'semester_count')) {
                $table->integer('semester_count')->default(1)->after('duration_years');
            }
        });

        DB::statement("ALTER TABLE programmes MODIFY COLUMN `level` ENUM('certificate', 'diploma', 'degree', 'bachelor', 'master', 'phd', 'crash_course', 'other') NOT NULL DEFAULT 'degree'");
    }

    public function down()
    {
        Schema::table('programmes', function (Blueprint $table) {
            if (Schema::hasColumn('programmes', 'semester_count')) {
                $table->dropColumn('semester_count');
            }
        });

        DB::statement("ALTER TABLE programmes MODIFY COLUMN `level` ENUM('certificate', 'diploma', 'degree', 'master', 'phd') NOT NULL DEFAULT 'degree'");
    }
}
