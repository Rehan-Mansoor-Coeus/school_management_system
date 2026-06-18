<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePeopleStudentsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('people_students')) {
            Schema::create('people_students', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->string('name');
                $table->string('email')->nullable();
                $table->string('phone_number');
                $table->string('additional_phone_number')->nullable();
                $table->text('address')->nullable();
                $table->string('status')->default('active')->index();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('people_students');
    }
}
