<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLeavesTable extends Migration
{
    public function up()
    {
        Schema::create('leaves', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('staff_id');
            $table->string('reference_number')->unique();
            $table->enum('leave_type', ['annual', 'sick', 'maternity', 'paternity', 'study', 'compassionate', 'unpaid'])->default('annual');
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('number_of_days');
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->text('reason');
            $table->text('approved_comment')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->index('institution_id');
            $table->index('staff_id');
            $table->index('reference_number');
            $table->index('status');
            $table->index('leave_type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('leaves');
    }
}
