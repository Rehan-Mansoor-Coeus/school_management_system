<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddProgrammeRequiredDocumentsAndApplicationSignature extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('programme_required_documents')) {
            Schema::create('programme_required_documents', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('programme_id');
                $table->string('name');
                $table->text('description')->nullable();
                $table->boolean('is_required')->default(true);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->foreign('programme_id')->references('id')->on('programmes')->onDelete('cascade');
                $table->index(['programme_id', 'sort_order']);
            });
        }

        if (Schema::hasTable('application_documents')) {
            Schema::table('application_documents', function (Blueprint $table) {
                if (! Schema::hasColumn('application_documents', 'programme_required_document_id')) {
                    $table->unsignedBigInteger('programme_required_document_id')->nullable()->after('applicant_id');
                    $table->foreign('programme_required_document_id', 'app_docs_prog_req_doc_fk')
                        ->references('id')->on('programme_required_documents')->onDelete('set null');
                }
                if (! Schema::hasColumn('application_documents', 'comment')) {
                    $table->text('comment')->nullable()->after('document_name');
                }
            });
        }

        if (Schema::hasTable('applications')) {
            Schema::table('applications', function (Blueprint $table) {
                if (! Schema::hasColumn('applications', 'applicant_signature_path')) {
                    $table->string('applicant_signature_path')->nullable()->after('status');
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('application_documents')) {
            Schema::table('application_documents', function (Blueprint $table) {
                if (Schema::hasColumn('application_documents', 'programme_required_document_id')) {
                    $table->dropForeign('app_docs_prog_req_doc_fk');
                    $table->dropColumn('programme_required_document_id');
                }
                if (Schema::hasColumn('application_documents', 'comment')) {
                    $table->dropColumn('comment');
                }
            });
        }

        if (Schema::hasTable('applications') && Schema::hasColumn('applications', 'applicant_signature_path')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->dropColumn('applicant_signature_path');
            });
        }

        Schema::dropIfExists('programme_required_documents');
    }
}
