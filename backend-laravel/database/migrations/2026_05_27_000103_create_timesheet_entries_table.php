<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimesheetEntriesTable extends Migration
{
    public function up()
    {
        Schema::create('timesheet_entries', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('timesheet_id');
            $table->unsignedBigInteger('activity_id');
            $table->date('work_date');
            $table->decimal('hours_worked', 5, 2);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('institution_id');
            $table->index(['institution_id', 'work_date']);
            $table->foreign('timesheet_id')->references('id')->on('timesheets')->onDelete('cascade');
            $table->foreign('activity_id')->references('id')->on('timesheet_activities')->onDelete('restrict');
        });
    }

    public function down()
    {
        Schema::dropIfExists('timesheet_entries');
    }
}
