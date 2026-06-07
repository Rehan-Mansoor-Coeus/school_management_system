<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateApplicationDocumentsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('application_documents')) {
            Schema::create('application_documents', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('application_id');
                $table->unsignedBigInteger('applicant_id')->nullable();
                $table->string('document_name');
                $table->string('file_path');
                $table->string('mime_type')->nullable();
                $table->unsignedBigInteger('file_size')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('application_id')->references('id')->on('applications')->onDelete('cascade');
                $table->foreign('applicant_id')->references('id')->on('applicants')->onDelete('set null');
                $table->index('application_id');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('application_documents');
    }
}
