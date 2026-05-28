<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInstitutionSettingsTable extends Migration
{
    public function up()
    {
        Schema::create('institution_settings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->json('academic_structure')->nullable();
            $table->json('fee_structure')->nullable();
            $table->json('grading_system')->nullable();
            $table->json('academic_calendar')->nullable();
            $table->json('payment_settings')->nullable();
            $table->timestamps();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->unique('institution_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('institution_settings');
    }
}

