<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimesheetActivitiesTable extends Migration
{
    public function up()
    {
        Schema::create('timesheet_activities', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->string('name');
            $table->string('code', 60)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index('institution_id');
            $table->index(['institution_id', 'is_active']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('timesheet_activities');
    }
}
