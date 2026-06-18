<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStaffWorkingSchedulesTable extends Migration
{
    public function up()
    {
        Schema::create('staff_working_schedules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('staff_id');
            $table->unsignedTinyInteger('weekday');
            $table->decimal('expected_hours', 5, 2)->default(0);
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('institution_id');
            $table->index(['institution_id', 'staff_id']);
            $table->index(['institution_id', 'weekday']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('staff_working_schedules');
    }
}
