<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStaffWorkSchedulesTable extends Migration
{
    public function up()
    {
        Schema::create('staff_work_schedules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('campus_id')->nullable();
            $table->unsignedBigInteger('staff_id');
            $table->unsignedBigInteger('shift_type_id')->nullable();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('expected_minutes')->default(0);
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->index(['institution_id', 'staff_id', 'day_of_week']);
            $table->foreign('shift_type_id')->references('id')->on('shift_types')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('staff_work_schedules');
    }
}
