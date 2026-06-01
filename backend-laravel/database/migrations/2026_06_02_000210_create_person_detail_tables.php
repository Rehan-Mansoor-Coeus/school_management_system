<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePersonDetailTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('student_details')) {
            Schema::create('student_details', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id')->unique();
                $table->string('registration_number')->nullable()->index();
                $table->date('admission_date')->nullable();
                $table->string('current_level')->nullable();
                $table->string('guardian_name')->nullable();
                $table->string('guardian_phone')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('teacher_details')) {
            Schema::create('teacher_details', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id')->unique();
                $table->string('staff_number')->nullable()->index();
                $table->string('qualification')->nullable();
                $table->string('specialization')->nullable();
                $table->string('employment_type')->nullable();
                $table->date('hire_date')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('staff_details')) {
            Schema::create('staff_details', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id')->unique();
                $table->string('staff_number')->nullable()->index();
                $table->string('designation')->nullable();
                $table->unsignedBigInteger('department_id')->nullable()->index();
                $table->string('employment_type')->nullable();
                $table->date('hire_date')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('student_details');
        Schema::dropIfExists('teacher_details');
        Schema::dropIfExists('staff_details');
    }
}
