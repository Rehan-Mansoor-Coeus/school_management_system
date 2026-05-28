<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimesheetCategoriesTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('timesheet_categories')) {
            return;
        }

        Schema::create('timesheet_categories', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color_tag', 20)->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->index('institution_id');
            $table->index(['institution_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('timesheet_categories');
    }
}
