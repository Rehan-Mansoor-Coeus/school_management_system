<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimesheetWorkingWeeksTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('timesheet_working_weeks')) {
            return;
        }

        Schema::create('timesheet_working_weeks', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedTinyInteger('day_of_week');
            $table->boolean('is_working_day')->default(false);
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->unsignedSmallInteger('break_minutes')->default(0);
            $table->unsignedInteger('expected_minutes')->default(0);
            $table->timestamps();

            $table->unique(['institution_id', 'user_id', 'day_of_week'], 'ts_working_week_user_day_unique');
            $table->index(['institution_id', 'user_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('timesheet_working_weeks');
    }
}
