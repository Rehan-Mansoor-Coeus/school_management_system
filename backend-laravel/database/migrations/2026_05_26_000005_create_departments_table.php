<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDepartmentsTable extends Migration
{
    public function up()
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('hod_id')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('office_location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('hod_id')->references('id')->on('users')->onDelete('set null');
            $table->index('institution_id');
            $table->index('code');
            $table->index('hod_id');
            $table->index('is_active');
            $table->unique(['institution_id', 'code']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('departments');
    }
}
