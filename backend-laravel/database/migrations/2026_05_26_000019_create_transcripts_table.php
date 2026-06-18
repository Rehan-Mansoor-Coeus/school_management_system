<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTranscriptsTable extends Migration
{
    public function up()
    {
        Schema::create('transcripts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('student_id');
            $table->string('reference_number')->unique();
            $table->text('academic_summary')->nullable();
            $table->decimal('final_gpa', 4, 2)->default(0);
            $table->integer('total_credits')->default(0);
            $table->date('graduation_date')->nullable();
            $table->string('pdf_path')->nullable();
            $table->boolean('is_official')->default(false);
            $table->boolean('is_issued')->default(false);
            $table->timestamp('issued_at')->nullable();
            $table->integer('copies_issued')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('student_id');
            $table->index('reference_number');
            $table->index('is_official');
            $table->index('is_issued');
        });
    }

    public function down()
    {
        Schema::dropIfExists('transcripts');
    }
}
