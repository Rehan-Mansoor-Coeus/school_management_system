<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateResultAppealsTable extends Migration
{
    public function up()
    {
        Schema::create('result_appeals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('result_id');
            $table->unsignedBigInteger('student_id');
            $table->text('reason');
            $table->enum('status', ['pending', 'under_review', 'approved', 'rejected'])->default('pending');
            $table->text('reviewer_comment')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->decimal('revised_score', 5, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('result_id')->references('id')->on('results')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
            $table->index('institution_id');
            $table->index('result_id');
            $table->index('student_id');
            $table->index('status');
            $table->index('reviewed_by');
        });
    }

    public function down()
    {
        Schema::dropIfExists('result_appeals');
    }
}
