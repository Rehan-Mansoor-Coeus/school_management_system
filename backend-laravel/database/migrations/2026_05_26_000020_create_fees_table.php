<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFeesTable extends Migration
{
    public function up()
    {
        Schema::create('fees', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('semester_id');
            $table->string('invoice_number')->unique();
            $table->decimal('tuition_fee', 12, 2)->default(0);
            $table->decimal('registration_fee', 12, 2)->default(0);
            $table->decimal('hostel_fee', 12, 2)->default(0);
            $table->decimal('library_fee', 12, 2)->default(0);
            $table->decimal('other_charges', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('balance', 12, 2);
            $table->enum('status', ['pending', 'partial', 'paid', 'cancelled'])->default('pending');
            $table->date('due_date')->nullable();
            $table->date('paid_date')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('student_id');
            $table->index('semester_id');
            $table->index('invoice_number');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('fees');
    }
}
