<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimesheetApprovalsTable extends Migration
{
    public function up()
    {
        Schema::create('timesheet_approvals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('timesheet_id');
            $table->unsignedBigInteger('acted_by');
            $table->string('action', 30);
            $table->text('comment')->nullable();
            $table->timestamp('acted_at');
            $table->timestamps();

            $table->index('institution_id');
            $table->index(['institution_id', 'action']);
            $table->foreign('timesheet_id')->references('id')->on('timesheets')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('timesheet_approvals');
    }
}
