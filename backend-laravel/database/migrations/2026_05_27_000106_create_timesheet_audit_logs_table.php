<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimesheetAuditLogsTable extends Migration
{
    public function up()
    {
        Schema::create('timesheet_audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('timesheet_id')->nullable();
            $table->unsignedBigInteger('entry_id')->nullable();
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('event', 40);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('institution_id');
            $table->index(['institution_id', 'event']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('timesheet_audit_logs');
    }
}
