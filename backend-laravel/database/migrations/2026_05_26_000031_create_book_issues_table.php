<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBookIssuesTable extends Migration
{
    public function up()
    {
        Schema::create('book_issues', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('library_book_id');
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('staff_id')->nullable();
            $table->string('issue_reference')->unique();
            $table->date('issue_date');
            $table->date('due_date');
            $table->date('return_date')->nullable();
            $table->enum('status', ['issued', 'overdue', 'returned', 'lost'])->default('issued');
            $table->integer('fine_amount')->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('library_book_id')->references('id')->on('library_books')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('set null');
            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('set null');
            $table->index('institution_id');
            $table->index('library_book_id');
            $table->index('student_id');
            $table->index('staff_id');
            $table->index('issue_reference');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('book_issues');
    }
}
