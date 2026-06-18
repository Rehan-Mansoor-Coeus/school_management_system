<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ensures the Timetable & Courses module is registered and enabled for every
 * institution so the sidebar menu is visible after deploying the module.
 */
class EnableTimetableModuleForInstitutions extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('modules') || ! Schema::hasTable('institutions') || ! Schema::hasTable('institution_modules')) {
            return;
        }

        $moduleId = DB::table('modules')->where('key', 'timetable')->value('id');

        if (! $moduleId) {
            $moduleId = DB::table('modules')->insertGetId([
                'key' => 'timetable',
                'name' => 'Timetable & Courses',
                'sort_order' => 115,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach (DB::table('institutions')->pluck('id') as $institutionId) {
            DB::table('institution_modules')->updateOrInsert(
                ['institution_id' => $institutionId, 'module_id' => $moduleId],
                ['enabled' => true, 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }

    public function down()
    {
        // Intentionally left as a no-op: disabling the module on rollback could
        // hide it for institutions that legitimately rely on it.
    }
}
