<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateContractsTable extends Migration
{
    public function up()
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('staff_id');
            $table->string('contract_number')->unique();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->enum('contract_type', ['fixed_term', 'permanent', 'project'])->default('fixed_term');
            $table->text('terms_and_conditions')->nullable();
            $table->decimal('contract_value', 12, 2)->nullable();
            $table->string('contract_document_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('staff_id');
            $table->index('contract_number');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('contracts');
    }
}
