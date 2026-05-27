<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSemestersTable extends Migration
{
    public function up()
    {
        Schema::create('semesters', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('academic_year_id');
            $table->enum('name', ['first', 'second', 'third'])->default('first');
            $table->date('start_date');
            $table->date('end_date');
            $table->date('registration_start')->nullable();
            $table->date('registration_end')->nullable();
            $table->date('exam_start')->nullable();
            $table->date('exam_end')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('academic_year_id');
            $table->index('is_active');
            $table->unique(['institution_id', 'academic_year_id', 'name']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('semesters');
    }
}
