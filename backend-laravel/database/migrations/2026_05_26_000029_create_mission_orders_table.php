<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMissionOrdersTable extends Migration
{
    public function up()
    {
        Schema::create('mission_orders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('staff_id');
            $table->string('reference_number')->unique();
            $table->string('destination');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('purpose');
            $table->decimal('budget_approved', 12, 2)->default(0);
            $table->decimal('amount_spent', 12, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->text('report')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->string('document_path')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->index('institution_id');
            $table->index('staff_id');
            $table->index('reference_number');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('mission_orders');
    }
}
