<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateApplicationsTable extends Migration
{
    public function up()
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('applicant_id');
            $table->unsignedBigInteger('academic_year_id');
            $table->unsignedBigInteger('programme_id');
            $table->string('application_number')->unique();
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'admitted', 'enrolled'])->default('draft');
            $table->decimal('application_fee', 12, 2)->default(0);
            $table->boolean('application_fee_paid')->default(false);
            $table->timestamp('fee_paid_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('admission_comment')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('admitted_by')->nullable();
            $table->timestamp('admitted_at')->nullable();
            $table->boolean('admission_letter_sent')->default(false);
            $table->timestamp('admission_letter_sent_at')->nullable();
            $table->boolean('admission_accepted')->default(false);
            $table->timestamp('admission_accepted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('applicant_id')->references('id')->on('applicants')->onDelete('cascade');
            $table->foreign('academic_year_id')->references('id')->on('academic_years')->onDelete('cascade');
            $table->foreign('programme_id')->references('id')->on('programmes')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('admitted_by')->references('id')->on('users')->onDelete('set null');
            $table->index('institution_id');
            $table->index('applicant_id');
            $table->index('academic_year_id');
            $table->index('programme_id');
            $table->index('application_number');
            $table->index('status');
            $table->index('reviewed_by');
            $table->index('approved_by');
            $table->index('admitted_by');
        });
    }

    public function down()
    {
        Schema::dropIfExists('applications');
    }
}
