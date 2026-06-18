<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateShiftTypesTable extends Migration
{
    public function up()
    {
        Schema::create('shift_types', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('campus_id')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('default_duration_minutes')->default(45);
            $table->boolean('is_teaching_shift')->default(false);
            $table->boolean('is_staff_shift')->default(false);
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->index(['institution_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('shift_types');
    }
}
