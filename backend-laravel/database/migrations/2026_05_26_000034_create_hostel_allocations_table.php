<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateHostelAllocationsTable extends Migration
{
    public function up()
    {
        Schema::create('hostel_allocations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('room_id');
            $table->unsignedBigInteger('academic_year_id');
            $table->date('allocation_date');
            $table->date('check_in_date')->nullable();
            $table->date('check_out_date')->nullable();
            $table->enum('status', ['allocated', 'active', 'completed', 'cancelled'])->default('allocated');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('student_id');
            $table->index('room_id');
            $table->index('academic_year_id');
            $table->index('status');
            $table->unique(['student_id', 'academic_year_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('hostel_allocations');
    }
}
