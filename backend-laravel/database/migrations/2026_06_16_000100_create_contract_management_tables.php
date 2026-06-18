<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateContractManagementTables extends Migration
{
    public function up()
    {
        if (Schema::hasTable('contracts') && ! Schema::hasColumn('contracts', 'reference_number')) {
            Schema::rename('contracts', 'hr_legacy_contracts');
        }

        if (! Schema::hasTable('contract_templates')) {
            Schema::create('contract_templates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->string('name');
            $table->string('code', 80)->nullable();
            $table->string('category', 80)->default('general');
            $table->string('recipient_type', 40)->default('staff');
            $table->text('description')->nullable();
            $table->longText('body_html');
            $table->json('merge_fields')->nullable();
            $table->json('required_documents')->nullable();
            $table->json('signer_fields')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_archived')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['institution_id', 'category']);
            $table->index(['institution_id', 'recipient_type']);
            $table->index(['institution_id', 'is_active']);
            });
        }

        if (! Schema::hasTable('contracts')) {
            Schema::create('contracts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('template_id')->nullable();
            $table->string('reference_number', 80)->unique();
            $table->string('title');
            $table->string('category', 80)->nullable();
            $table->string('recipient_type', 40)->default('staff');
            $table->string('status', 40)->default('draft');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('hr_staff_profile_id')->nullable();
            $table->string('recipient_name');
            $table->string('recipient_email')->nullable();
            $table->string('recipient_phone')->nullable();
            $table->longText('body_html');
            $table->json('merge_data')->nullable();
            $table->json('signer_data')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('signature_path')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->string('signed_ip')->nullable();
            $table->text('signed_user_agent')->nullable();
            $table->string('executed_pdf_path')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['institution_id', 'status']);
            $table->index(['institution_id', 'recipient_type']);
            $table->index(['institution_id', 'end_date']);
            $table->index('user_id');
            $table->index('student_id');
            });
        }

        if (! Schema::hasTable('contract_signatories')) {
            Schema::create('contract_signatories', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('contract_id');
            $table->string('role', 40)->default('recipient');
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('signature_path')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->string('signed_ip')->nullable();
            $table->timestamps();

            $table->index(['contract_id', 'role']);
            });
        }

        if (! Schema::hasTable('contract_approvals')) {
            Schema::create('contract_approvals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('contract_id');
            $table->unsignedBigInteger('approver_id')->nullable();
            $table->string('approver_role', 80)->nullable();
            $table->unsignedSmallInteger('step_order')->default(1);
            $table->string('status', 30)->default('pending');
            $table->text('comments')->nullable();
            $table->timestamp('acted_at')->nullable();
            $table->timestamps();

            $table->index(['contract_id', 'status']);
            });
        }

        if (! Schema::hasTable('contract_documents')) {
            Schema::create('contract_documents', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('contract_id');
            $table->string('document_type', 80)->default('supporting');
            $table->string('label')->nullable();
            $table->string('file_path');
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->string('upload_source', 30)->default('internal');
            $table->timestamps();

            $table->index('contract_id');
            });
        }

        if (! Schema::hasTable('contract_access_tokens')) {
            Schema::create('contract_access_tokens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('contract_id');
            $table->string('token_hash', 128)->unique();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('single_use')->default(false);
            $table->timestamp('used_at')->nullable();
            $table->string('last_ip')->nullable();
            $table->text('last_user_agent')->nullable();
            $table->timestamps();

            $table->index(['contract_id', 'expires_at']);
            });
        }

        if (! Schema::hasTable('contract_status_logs')) {
            Schema::create('contract_status_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('contract_id');
            $table->string('from_status', 40)->nullable();
            $table->string('to_status', 40);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('actor_type', 40)->default('user');
            $table->text('notes')->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->timestamps();

            $table->index('contract_id');
            });
        }

        if (! Schema::hasTable('contract_notifications')) {
            Schema::create('contract_notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('contract_id');
            $table->string('channel', 30);
            $table->string('recipient');
            $table->string('status', 30)->default('pending');
            $table->text('message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['contract_id', 'channel']);
            });
        }

        if (! Schema::hasTable('contract_renewals')) {
            Schema::create('contract_renewals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('original_contract_id');
            $table->unsignedBigInteger('renewed_contract_id')->nullable();
            $table->date('previous_end_date')->nullable();
            $table->date('new_end_date')->nullable();
            $table->unsignedBigInteger('renewed_by')->nullable();
            $table->timestamps();

            $table->index('original_contract_id');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('contract_renewals');
        Schema::dropIfExists('contract_notifications');
        Schema::dropIfExists('contract_status_logs');
        Schema::dropIfExists('contract_access_tokens');
        Schema::dropIfExists('contract_documents');
        Schema::dropIfExists('contract_approvals');
        Schema::dropIfExists('contract_signatories');
        Schema::dropIfExists('contracts');
        Schema::dropIfExists('contract_templates');
    }
}
