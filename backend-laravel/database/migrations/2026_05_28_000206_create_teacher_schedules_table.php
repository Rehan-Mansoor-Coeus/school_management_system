<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTeacherSchedulesTable extends Migration
{
    public function up()
    {
        Schema::create('teacher_schedules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('campus_id')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('academic_year_id')->nullable();
            $table->unsignedBigInteger('period_id')->nullable();
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('course_id')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('shift_type_id');
            $table->unsignedBigInteger('course_contact_hour_plan_id')->nullable();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('expected_minutes');
            $table->decimal('expected_contact_hours', 8, 2);
            $table->string('schedule_source', 20)->default('manual');
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->index(['institution_id', 'teacher_id', 'day_of_week']);
            $table->index(['institution_id', 'class_id', 'day_of_week']);
            $table->foreign('shift_type_id')->references('id')->on('shift_types')->onDelete('restrict');
            $table->foreign('course_contact_hour_plan_id', 'ts_plan_fk')
                ->references('id')->on('course_contact_hour_plans')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('teacher_schedules');
    }
}
