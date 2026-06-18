<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotificationsTable extends Migration
{
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('user_id');
            $table->string('title');
            $table->text('message');
            $table->enum('type', ['info', 'success', 'warning', 'error', 'alert'])->default('info');
            $table->enum('category', ['admission', 'academic', 'fee', 'hostel', 'library', 'other'])->default('other');
            $table->string('link')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->boolean('is_sent_email')->default(false);
            $table->boolean('is_sent_sms')->default(false);
            $table->boolean('is_sent_whatsapp')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('user_id');
            $table->index('type');
            $table->index('category');
            $table->index('is_read');
        });
    }

    public function down()
    {
        Schema::dropIfExists('notifications');
    }
}
