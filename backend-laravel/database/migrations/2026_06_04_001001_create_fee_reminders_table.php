<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFeeRemindersTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('fee_reminders')) {
            return;
        }

        Schema::create('fee_reminders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('title');
            $table->text('message');
            $table->enum('reminder_type', ['manual', 'scheduled', 'due_date', 'overdue', 'outstanding'])->default('manual');
            $table->enum('status', ['draft', 'scheduled', 'sending', 'sent', 'cancelled'])->default('draft');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->json('filters')->nullable();
            $table->unsignedInteger('recipient_count')->default(0);
            $table->timestamps();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['institution_id', 'status']);
            $table->index('scheduled_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('fee_reminders');
    }
}
