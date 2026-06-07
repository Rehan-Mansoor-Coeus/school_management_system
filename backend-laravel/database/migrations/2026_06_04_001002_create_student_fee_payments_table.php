<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentFeePaymentsTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('student_fee_payments')) {
            return;
        }

        Schema::create('student_fee_payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('fee_id');
            $table->string('reference_number')->unique();
            $table->string('transaction_id')->nullable();
            $table->enum('payment_type', ['tuition', 'registration', 'hostel', 'library', 'other'])->default('tuition');
            $table->enum('payment_method', ['cash', 'bank_transfer', 'online', 'check', 'other'])->default('bank_transfer');
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('completed');
            $table->text('description')->nullable();
            $table->string('receipt_number')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->unsignedBigInteger('recorded_by')->nullable();
            $table->text('gateway_response')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('fee_id')->references('id')->on('fees')->onDelete('cascade');
            $table->foreign('recorded_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['institution_id', 'student_id']);
            $table->index('fee_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('student_fee_payments');
    }
}
