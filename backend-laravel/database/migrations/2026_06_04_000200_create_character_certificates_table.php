<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCharacterCertificatesTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('character_certificates')) {
            return;
        }

        Schema::create('character_certificates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('student_id');
            $table->string('certificate_number')->unique();
            $table->string('purpose')->nullable();
            $table->text('conduct_remarks')->nullable();
            $table->string('academic_standing')->nullable();
            $table->text('academic_standing_notes')->nullable();
            $table->boolean('finance_cleared')->default(false);
            $table->text('finance_clearance_notes')->nullable();
            $table->timestamp('finance_cleared_at')->nullable();
            $table->unsignedBigInteger('finance_cleared_by')->nullable();
            $table->boolean('library_cleared')->default(false);
            $table->text('library_clearance_notes')->nullable();
            $table->timestamp('library_cleared_at')->nullable();
            $table->unsignedBigInteger('library_cleared_by')->nullable();
            $table->unsignedBigInteger('registrar_user_id')->nullable();
            $table->string('registrar_name')->nullable();
            $table->enum('status', ['draft', 'pending', 'issued', 'void'])->default('draft');
            $table->string('pdf_path')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('finance_cleared_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('library_cleared_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('registrar_user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['institution_id', 'status']);
            $table->index(['student_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('character_certificates');
    }
}
