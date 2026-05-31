<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

class AddDepartmentsModule extends Migration
{
    public function up()
    {
        DB::table('modules')->updateOrInsert(
            ['key' => 'departments'],
            ['name' => 'Departments', 'sort_order' => 45, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]
        );

        $module = DB::table('modules')->where('key', 'departments')->first();
        if ($module) {
            $institutions = DB::table('institutions')->get(['id']);
            foreach ($institutions as $institution) {
                DB::table('institution_modules')->updateOrInsert(
                    ['institution_id' => $institution->id, 'module_id' => $module->id],
                    ['enabled' => true, 'updated_at' => now(), 'created_at' => now()]
                );
            }
        }
    }

    public function down()
    {
        $module = DB::table('modules')->where('key', 'departments')->first();
        if ($module) {
            DB::table('institution_modules')->where('module_id', $module->id)->delete();
            DB::table('modules')->where('id', $module->id)->delete();
        }
    }
}
