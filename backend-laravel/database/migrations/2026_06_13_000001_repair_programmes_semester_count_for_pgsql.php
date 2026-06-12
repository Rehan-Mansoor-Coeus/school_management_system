<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RepairProgrammesSemesterCountForPgsql extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('programmes')) {
            return;
        }

        Schema::table('programmes', function (Blueprint $table) {
            if (! Schema::hasColumn('programmes', 'semester_count')) {
                $table->integer('semester_count')->default(1);
            }
        });

        if (Schema::hasColumn('programmes', 'semester_count')) {
            DB::table('programmes')
                ->whereNull('semester_count')
                ->update(['semester_count' => 1]);
        }

        if (DB::getDriverName() === 'pgsql' && Schema::hasColumn('programmes', 'level')) {
            DB::statement('ALTER TABLE programmes DROP CONSTRAINT IF EXISTS programmes_level_check');
            DB::statement("ALTER TABLE programmes ADD CONSTRAINT programmes_level_check CHECK (level IN ('certificate', 'diploma', 'degree', 'bachelor', 'master', 'phd', 'crash_course', 'other'))");
        }
    }

    public function down()
    {
        // Non-destructive repair migration.
    }
}
