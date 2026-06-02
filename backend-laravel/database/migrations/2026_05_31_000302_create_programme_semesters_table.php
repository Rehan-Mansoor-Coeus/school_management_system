<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProgrammeSemestersTable extends Migration
{
    public function up()
    {
        Schema::create('programme_semesters', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('programme_id');
            $table->integer('semester_number');
            $table->string('name')->default('Semester');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('programme_id')->references('id')->on('programmes')->onDelete('cascade');
            $table->unique(['programme_id', 'semester_number']);
            $table->index('programme_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('programme_semesters');
    }
}
