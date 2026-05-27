<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStaffTimesheetEntriesTable extends Migration
{
    public function up()
    {
        Schema::create('staff_timesheet_entries', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('staff_id');
            $table->unsignedBigInteger('staff_work_schedule_id')->nullable();
            $table->date('date');
            $table->unsignedBigInteger('activity_id')->nullable();
            $table->time('actual_start_time');
            $table->time('actual_end_time');
            $table->unsignedSmallInteger('actual_minutes');
            $table->text('description')->nullable();
            $table->text('remarks')->nullable();
            $table->string('status', 30)->default('draft');
            $table->timestamps();
            $table->index(['institution_id', 'staff_id', 'date']);
            $table->foreign('staff_work_schedule_id')->references('id')->on('staff_work_schedules')->onDelete('set null');
            $table->foreign('activity_id')->references('id')->on('timesheet_activities')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('staff_timesheet_entries');
    }
}
