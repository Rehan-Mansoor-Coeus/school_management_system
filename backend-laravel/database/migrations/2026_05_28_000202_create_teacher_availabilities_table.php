<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTeacherAvailabilitiesTable extends Migration
{
    public function up()
    {
        // Skipped: table already exists in the database.
        // Schema::create('teacher_availabilities', function (Blueprint $table) {
        //     $table->bigIncrements('id');
        //     $table->unsignedBigInteger('institution_id');
        //     $table->unsignedBigInteger('campus_id')->nullable();
        //     $table->unsignedBigInteger('department_id')->nullable();
        //     $table->unsignedBigInteger('teacher_id');
        //     $table->unsignedTinyInteger('day_of_week');
        //     $table->time('start_time');
        //     $table->time('end_time');
        //     $table->unsignedSmallInteger('expected_minutes')->default(0);
        //     $table->string('status', 20)->default('active');
        //     $table->timestamps();
        //     $table->index(['institution_id', 'teacher_id', 'day_of_week']);
        // });
    }

    public function down()
    {
        // Skipped: preserve existing table from outside this migration flow.
        // Schema::dropIfExists('teacher_availabilities');
    }
}
