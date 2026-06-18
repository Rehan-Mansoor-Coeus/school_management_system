<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimesheetReferenceTables extends Migration
{
    public function up()
    {
        Schema::create('timesheet_academic_years', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->string('name');
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('institution_id');
        });

        Schema::create('timesheet_periods', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('academic_year_id');
            $table->string('period_type', 20); // semester, term, trimester
            $table->string('name');
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['institution_id', 'academic_year_id']);
        });

        Schema::create('timesheet_courses', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('campus_id')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->string('name');
            $table->string('code', 60)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('institution_id');
        });

        Schema::create('timesheet_classes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('campus_id')->nullable();
            $table->string('name');
            $table->string('level', 60)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('institution_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('timesheet_classes');
        Schema::dropIfExists('timesheet_courses');
        Schema::dropIfExists('timesheet_periods');
        Schema::dropIfExists('timesheet_academic_years');
    }
}
