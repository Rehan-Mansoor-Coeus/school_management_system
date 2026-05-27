<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateReportCardsTable extends Migration
{
    public function up()
    {
        Schema::create('report_cards', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('semester_id');
            $table->string('reference_number')->unique();
            $table->decimal('semester_gpa', 4, 2);
            $table->decimal('cumulative_gpa', 4, 2);
            $table->integer('total_credits')->default(0);
            $table->integer('passed_courses')->default(0);
            $table->integer('failed_courses')->default(0);
            $table->text('remarks')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('semester_id')->references('id')->on('semesters')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('student_id');
            $table->index('semester_id');
            $table->index('reference_number');
            $table->index('is_published');
        });
    }

    public function down()
    {
        Schema::dropIfExists('report_cards');
    }
}
