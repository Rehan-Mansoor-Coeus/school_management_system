<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCourseContactHourTeachersTable extends Migration
{
    public function up()
    {
        Schema::create('course_contact_hour_teachers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('course_contact_hour_plan_id');
            $table->unsignedBigInteger('teacher_id');
            $table->decimal('assigned_contact_hours', 8, 2)->nullable();
            $table->decimal('completed_contact_hours', 8, 2)->default(0);
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->unique(['course_contact_hour_plan_id', 'teacher_id'], 'plan_teacher_unique');
            $table->foreign('course_contact_hour_plan_id', 'ccht_plan_fk')
                ->references('id')->on('course_contact_hour_plans')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('course_contact_hour_teachers');
    }
}
