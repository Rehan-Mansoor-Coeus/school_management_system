<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProgrammeSemesterSubjectsTable extends Migration
{
    public function up()
    {
        Schema::create('programme_semester_subjects', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('programme_semester_id');
            $table->unsignedBigInteger('subject_id');
            $table->integer('contact_hours')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('programme_semester_id')->references('id')->on('programme_semesters')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->unique(['programme_semester_id', 'subject_id'], 'pss_programme_semester_subject_unique');
            $table->index('programme_semester_id');
            $table->index('subject_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('programme_semester_subjects');
    }
}
