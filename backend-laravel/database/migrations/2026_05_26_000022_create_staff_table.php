<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStaffTable extends Migration
{
    public function up()
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('department_id')->nullable();
            $table->string('staff_id')->unique();
            $table->string('designation');
            $table->enum('employment_type', ['permanent', 'contract', 'part_time', 'casual'])->default('permanent');
            $table->date('hire_date');
            $table->date('retirement_date')->nullable();
            $table->enum('status', ['active', 'inactive', 'on_leave', 'retired'])->default('active');
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->decimal('allowances', 12, 2)->default(0);
            $table->string('bank_account')->nullable();
            $table->string('bank_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->index('institution_id');
            $table->index('user_id');
            $table->index('department_id');
            $table->index('staff_id');
            $table->index('status');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('staff');
    }
}
