<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentsTable extends Migration
{
    public function up()
    {
        Schema::create('students', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('applicant_id');
            $table->unsignedBigInteger('programme_id');
            $table->string('registration_number')->unique();
            $table->enum('status', ['active', 'inactive', 'suspended', 'graduated', 'expelled'])->default('active');
            $table->date('admission_date');
            $table->date('graduation_date')->nullable();
            $table->integer('current_level')->default(100);
            $table->decimal('cumulative_gpa', 4, 2)->default(0);
            $table->string('sponsor_name')->nullable();
            $table->string('sponsor_phone')->nullable();
            $table->string('sponsor_email')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('applicant_id')->references('id')->on('applicants')->onDelete('cascade');
            $table->foreign('programme_id')->references('id')->on('programmes')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('user_id');
            $table->index('applicant_id');
            $table->index('programme_id');
            $table->index('registration_number');
            $table->index('status');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('students');
    }
}
