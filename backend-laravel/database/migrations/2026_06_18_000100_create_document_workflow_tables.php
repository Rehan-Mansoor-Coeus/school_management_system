<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDocumentWorkflowTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('document_types')) {
            Schema::create('document_types', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('key', 100);
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('category', 80)->default('general');
                $table->string('recipient_type', 40)->default('staff');
                $table->unsignedBigInteger('default_template_id')->nullable();
                $table->json('required_signatories')->nullable();
                $table->json('required_approvers')->nullable();
                $table->json('required_uploads')->nullable();
                $table->json('field_schema')->nullable();
                $table->json('expiry_rules')->nullable();
                $table->json('notification_rules')->nullable();
                $table->boolean('supports_expiry')->default(false);
                $table->boolean('is_system')->default(false);
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->unique(['institution_id', 'key']);
                $table->index(['institution_id', 'is_active']);
            });
        }

        if (Schema::hasTable('contract_templates') && ! Schema::hasColumn('contract_templates', 'document_type_id')) {
            Schema::table('contract_templates', function (Blueprint $table) {
                $table->unsignedBigInteger('document_type_id')->nullable()->after('institution_id');
                $table->index('document_type_id');
            });
        }

        if (Schema::hasTable('contracts')) {
            Schema::table('contracts', function (Blueprint $table) {
                if (! Schema::hasColumn('contracts', 'document_type_id')) {
                    $table->unsignedBigInteger('document_type_id')->nullable()->after('template_id');
                    $table->index('document_type_id');
                }
                if (! Schema::hasColumn('contracts', 'verification_code')) {
                    $table->string('verification_code', 60)->nullable()->after('reference_number');
                    $table->index('verification_code');
                }
                if (! Schema::hasColumn('contracts', 'metadata')) {
                    $table->json('metadata')->nullable()->after('signer_data');
                }
            });
        }

        if (Schema::hasTable('contract_access_tokens') && ! Schema::hasColumn('contract_access_tokens', 'signatory_id')) {
            Schema::table('contract_access_tokens', function (Blueprint $table) {
                $table->unsignedBigInteger('signatory_id')->nullable()->after('contract_id');
                $table->timestamp('opened_at')->nullable()->after('used_at');
            });
        }

        if (Schema::hasTable('contract_signatories')) {
            Schema::table('contract_signatories', function (Blueprint $table) {
                if (! Schema::hasColumn('contract_signatories', 'sort_order')) {
                    $table->unsignedSmallInteger('sort_order')->default(0)->after('role');
                }
                if (! Schema::hasColumn('contract_signatories', 'label')) {
                    $table->string('label')->nullable()->after('role');
                }
                if (! Schema::hasColumn('contract_signatories', 'is_required')) {
                    $table->boolean('is_required')->default(true)->after('sort_order');
                }
                if (! Schema::hasColumn('contract_signatories', 'signed_user_agent')) {
                    $table->text('signed_user_agent')->nullable()->after('signed_ip');
                }
                if (! Schema::hasColumn('contract_signatories', 'opened_at')) {
                    $table->timestamp('opened_at')->nullable()->after('signed_at');
                }
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('document_types');

        if (Schema::hasTable('contract_templates') && Schema::hasColumn('contract_templates', 'document_type_id')) {
            Schema::table('contract_templates', function (Blueprint $table) {
                $table->dropColumn('document_type_id');
            });
        }

        if (Schema::hasTable('contracts')) {
            Schema::table('contracts', function (Blueprint $table) {
                foreach (['document_type_id', 'verification_code', 'metadata'] as $col) {
                    if (Schema::hasColumn('contracts', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('contract_access_tokens')) {
            Schema::table('contract_access_tokens', function (Blueprint $table) {
                foreach (['signatory_id', 'opened_at'] as $col) {
                    if (Schema::hasColumn('contract_access_tokens', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('contract_signatories')) {
            Schema::table('contract_signatories', function (Blueprint $table) {
                foreach (['sort_order', 'label', 'is_required', 'signed_user_agent', 'opened_at'] as $col) {
                    if (Schema::hasColumn('contract_signatories', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
}
