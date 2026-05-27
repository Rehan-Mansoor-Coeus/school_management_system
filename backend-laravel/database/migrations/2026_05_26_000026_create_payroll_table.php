<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePayrollTable extends Migration
{
    public function up()
    {
        Schema::create('payroll', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('staff_id');
            $table->string('payslip_number')->unique();
            $table->string('month')->default('current_month');
            $table->year('year');
            $table->decimal('basic_salary', 12, 2);
            $table->decimal('allowances', 12, 2)->default(0);
            $table->decimal('deductions', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('gross_salary', 12, 2);
            $table->decimal('net_salary', 12, 2);
            $table->enum('status', ['draft', 'approved', 'paid', 'cancelled'])->default('draft');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('staff_id');
            $table->index('payslip_number');
            $table->index('status');
            $table->unique(['staff_id', 'month', 'year']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('payroll');
    }
}
