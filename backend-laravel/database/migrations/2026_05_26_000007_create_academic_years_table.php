<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAcademicYearsTable extends Migration
{
    public function up()
    {
        Schema::create('academic_years', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->string('name');
            $table->string('code')->unique();
            $table->year('start_year');
            $table->year('end_year');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(false);
            $table->boolean('is_current')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('code');
            $table->index('is_active');
            $table->index('is_current');
            $table->unique(['institution_id', 'code']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('academic_years');
    }
}
