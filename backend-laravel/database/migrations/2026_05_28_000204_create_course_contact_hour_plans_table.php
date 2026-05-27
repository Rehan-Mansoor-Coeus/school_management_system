<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCourseContactHourPlansTable extends Migration
{
    public function up()
    {
        Schema::create('course_contact_hour_plans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('campus_id')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('academic_year_id');
            $table->unsignedBigInteger('period_id')->nullable();
            $table->unsignedBigInteger('course_id');
            $table->unsignedBigInteger('class_id')->nullable();
            $table->decimal('required_contact_hours', 8, 2);
            $table->decimal('scheduled_contact_hours', 8, 2)->default(0);
            $table->decimal('completed_contact_hours', 8, 2)->default(0);
            $table->decimal('remaining_contact_hours', 8, 2)->default(0);
            $table->unsignedSmallInteger('preferred_shift_duration_minutes')->default(45);
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->index(['institution_id', 'course_id']);
            $table->foreign('academic_year_id')->references('id')->on('timesheet_academic_years')->onDelete('cascade');
            $table->foreign('period_id')->references('id')->on('timesheet_periods')->onDelete('set null');
            $table->foreign('course_id')->references('id')->on('timesheet_courses')->onDelete('cascade');
            $table->foreign('class_id')->references('id')->on('timesheet_classes')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('course_contact_hour_plans');
    }
}
