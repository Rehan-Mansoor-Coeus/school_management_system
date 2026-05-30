<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimesheetNotificationsTable extends Migration
{
    public function up()
    {
        Schema::create('timesheet_notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('user_id');
            $table->string('channel', 20)->default('in_app');
            $table->string('event_key', 80);
            $table->string('locale', 5)->default('en');
            $table->string('title');
            $table->text('message');
            $table->json('payload')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['institution_id', 'user_id', 'read_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('timesheet_notifications');
    }
}
