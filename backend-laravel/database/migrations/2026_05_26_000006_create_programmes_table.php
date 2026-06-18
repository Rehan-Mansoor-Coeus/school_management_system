<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProgrammesTable extends Migration
{
    public function up()
    {
        Schema::create('programmes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('department_id');
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->integer('duration_years')->default(4);
            $table->enum('level', ['certificate', 'diploma', 'degree', 'master', 'phd'])->default('degree');
            $table->decimal('tuition_fee', 12, 2)->default(0);
            $table->decimal('registration_fee', 12, 2)->default(0);
            $table->string('accreditation_number')->nullable();
            $table->date('accreditation_expiry')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('department_id');
            $table->index('code');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('programmes');
    }
}
