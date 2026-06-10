<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibraryNotificationsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_notifications')) {
            Schema::create('library_notifications', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('borrow_request_id')->nullable()->index();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('event'); // requested, approved, rejected, issued, reminder, overdue, returned
                $table->string('channel')->default('whatsapp');
                $table->string('phone_number')->nullable();
                $table->text('message')->nullable();
                $table->string('status')->default('pending')->index();
                $table->text('error_message')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('library_notifications');
    }
}
