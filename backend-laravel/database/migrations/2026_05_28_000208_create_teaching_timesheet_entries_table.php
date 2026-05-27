<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTeachingTimesheetEntriesTable extends Migration
{
    public function up()
    {
        Schema::create('teaching_timesheet_entries', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('teacher_schedule_id');
            $table->unsignedBigInteger('course_contact_hour_plan_id')->nullable();
            $table->unsignedBigInteger('course_id')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->date('date');
            $table->time('scheduled_start_time');
            $table->time('scheduled_end_time');
            $table->time('actual_start_time');
            $table->time('actual_end_time');
            $table->unsignedSmallInteger('actual_minutes');
            $table->decimal('actual_contact_hours', 8, 2);
            $table->string('topic_taught');
            $table->string('sub_topic')->nullable();
            $table->text('activity_description')->nullable();
            $table->text('remarks')->nullable();
            $table->string('status', 30)->default('draft');
            $table->timestamps();
            $table->unique(['teacher_schedule_id', 'date'], 'teaching_entry_schedule_date_unique');
            $table->index(['institution_id', 'teacher_id', 'date']);
            $table->foreign('teacher_schedule_id')->references('id')->on('teacher_schedules')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('teaching_timesheet_entries');
    }
}
