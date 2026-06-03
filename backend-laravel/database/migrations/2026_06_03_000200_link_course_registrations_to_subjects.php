<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class LinkCourseRegistrationsToSubjects extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('course_registrations')) {
            return;
        }

        Schema::table('course_registrations', function (Blueprint $table) {
            if (! Schema::hasColumn('course_registrations', 'subject_id')) {
                $table->unsignedBigInteger('subject_id')->nullable()->after('course_id');
                $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
                $table->index('subject_id');
            }

            if (! Schema::hasColumn('course_registrations', 'programme_semester_id')) {
                $table->unsignedBigInteger('programme_semester_id')->nullable()->after('semester_id');
                $table->foreign('programme_semester_id')->references('id')->on('programme_semesters')->onDelete('set null');
                $table->index('programme_semester_id');
            }
        });

        if (Schema::hasColumn('course_registrations', 'course_id')) {
            DB::statement('ALTER TABLE course_registrations MODIFY course_id BIGINT UNSIGNED NULL');
        }

        if (Schema::hasColumn('course_registrations', 'semester_id')) {
            DB::statement('ALTER TABLE course_registrations MODIFY semester_id BIGINT UNSIGNED NULL');
        }
    }

    public function down()
    {
        if (! Schema::hasTable('course_registrations')) {
            return;
        }

        Schema::table('course_registrations', function (Blueprint $table) {
            if (Schema::hasColumn('course_registrations', 'programme_semester_id')) {
                $table->dropForeign(['programme_semester_id']);
                $table->dropColumn('programme_semester_id');
            }

            if (Schema::hasColumn('course_registrations', 'subject_id')) {
                $table->dropForeign(['subject_id']);
                $table->dropColumn('subject_id');
            }
        });
    }
}
