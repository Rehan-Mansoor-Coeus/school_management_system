<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaymentsTable extends Migration
{
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('fee_id')->nullable();
            $table->string('reference_number')->unique();
            $table->string('transaction_id')->nullable()->unique();
            $table->enum('payment_type', ['tuition', 'registration', 'hostel', 'library', 'other', 'application_fee'])->default('tuition');
            $table->enum('payment_method', ['flutterwave', 'paystack', 'bank_transfer', 'cash', 'check', 'online'])->default('flutterwave');
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])->default('pending');
            $table->text('description')->nullable();
            $table->string('receipt_number')->nullable()->unique();
            $table->timestamp('paid_at')->nullable();
            $table->text('gateway_response')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('set null');
            $table->foreign('fee_id')->references('id')->on('fees')->onDelete('set null');
            $table->index('institution_id');
            $table->index('student_id');
            $table->index('fee_id');
            $table->index('reference_number');
            $table->index('transaction_id');
            $table->index('status');
            $table->index('payment_type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('payments');
    }
}
