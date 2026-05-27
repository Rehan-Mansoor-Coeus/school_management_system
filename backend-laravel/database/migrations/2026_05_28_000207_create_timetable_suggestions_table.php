<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimetableSuggestionsTable extends Migration
{
    public function up()
    {
        Schema::create('timetable_suggestions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('campus_id')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('course_contact_hour_plan_id');
            $table->unsignedBigInteger('generated_by');
            $table->json('suggestion_payload');
            $table->decimal('total_required_contact_hours', 8, 2);
            $table->decimal('total_suggested_contact_hours', 8, 2)->default(0);
            $table->decimal('remaining_unscheduled_contact_hours', 8, 2)->default(0);
            $table->string('status', 20)->default('draft');
            $table->timestamps();
            $table->foreign('course_contact_hour_plan_id', 'tt_suggestion_plan_fk')
                ->references('id')->on('course_contact_hour_plans')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('timetable_suggestions');
    }
}
