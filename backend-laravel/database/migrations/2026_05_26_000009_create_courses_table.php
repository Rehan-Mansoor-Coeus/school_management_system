<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCoursesTable extends Migration
{
    public function up()
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('department_id');
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->integer('credit_units')->default(3);
            $table->integer('lecture_hours')->default(3);
            $table->integer('practical_hours')->default(0);
            $table->enum('level', ['100', '200', '300', '400', '500', '600'])->default('100');
            $table->boolean('is_required')->default(true);
            $table->decimal('pass_mark', 5, 2)->default(40);
            $table->unsignedBigInteger('lecturer_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('lecturer_id')->references('id')->on('users')->onDelete('set null');
            $table->index('institution_id');
            $table->index('department_id');
            $table->index('code');
            $table->index('level');
            $table->index('lecturer_id');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('courses');
    }
}
