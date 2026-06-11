<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsRequiredToProgrammeSemesterSubjects extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('programme_semester_subjects')) {
            return;
        }

        if (! Schema::hasColumn('programme_semester_subjects', 'is_required')) {
            Schema::table('programme_semester_subjects', function (Blueprint $table) {
                $table->boolean('is_required')->default(true)->after('contact_hours');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('programme_semester_subjects') && Schema::hasColumn('programme_semester_subjects', 'is_required')) {
            Schema::table('programme_semester_subjects', function (Blueprint $table) {
                $table->dropColumn('is_required');
            });
        }
    }
}
