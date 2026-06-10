<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAdmissionAgreementsAndDocumentReview extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('admission_agreements')) {
            Schema::create('admission_agreements', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('programme_id')->nullable();
                $table->string('title');
                $table->text('content');
                $table->boolean('is_required')->default(true);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('programme_id')->references('id')->on('programmes')->onDelete('cascade');
                $table->index(['institution_id', 'programme_id']);
            });
        }

        if (! Schema::hasTable('application_agreement_acceptances')) {
            Schema::create('application_agreement_acceptances', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('application_id');
                $table->unsignedBigInteger('admission_agreement_id');
                $table->timestamp('accepted_at');
                $table->timestamps();

                $table->foreign('application_id')->references('id')->on('applications')->onDelete('cascade');
                $table->foreign('admission_agreement_id', 'app_agreement_accept_agreement_fk')
                    ->references('id')->on('admission_agreements')->onDelete('cascade');
                $table->unique(['application_id', 'admission_agreement_id'], 'app_agreement_accept_unique');
            });
        }

        if (Schema::hasTable('application_documents')) {
            Schema::table('application_documents', function (Blueprint $table) {
                if (! Schema::hasColumn('application_documents', 'review_status')) {
                    $table->string('review_status', 20)->default('pending')->after('comment');
                }
                if (! Schema::hasColumn('application_documents', 'review_comment')) {
                    $table->text('review_comment')->nullable()->after('review_status');
                }
                if (! Schema::hasColumn('application_documents', 'reviewed_by')) {
                    $table->unsignedBigInteger('reviewed_by')->nullable()->after('review_comment');
                    $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
                }
                if (! Schema::hasColumn('application_documents', 'reviewed_at')) {
                    $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('application_documents')) {
            Schema::table('application_documents', function (Blueprint $table) {
                if (Schema::hasColumn('application_documents', 'reviewed_by')) {
                    $table->dropForeign(['reviewed_by']);
                }
                foreach (['review_status', 'review_comment', 'reviewed_by', 'reviewed_at'] as $column) {
                    if (Schema::hasColumn('application_documents', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        Schema::dropIfExists('application_agreement_acceptances');
        Schema::dropIfExists('admission_agreements');
    }
}
