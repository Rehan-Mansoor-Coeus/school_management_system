<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAdminSetupTokenToInstitutionRegistrationRequests extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('institution_registration_requests')) {
            return;
        }

        Schema::table('institution_registration_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('institution_registration_requests', 'admin_setup_token_hash')) {
                $table->string('admin_setup_token_hash', 64)->nullable()->after('admin_notes');
            }
            if (! Schema::hasColumn('institution_registration_requests', 'admin_setup_token_expires_at')) {
                $table->timestamp('admin_setup_token_expires_at')->nullable()->after('admin_setup_token_hash');
            }
            if (! Schema::hasColumn('institution_registration_requests', 'admin_setup_completed_at')) {
                $table->timestamp('admin_setup_completed_at')->nullable()->after('admin_setup_token_expires_at');
            }
        });
    }

    public function down()
    {
        if (! Schema::hasTable('institution_registration_requests')) {
            return;
        }

        Schema::table('institution_registration_requests', function (Blueprint $table) {
            if (Schema::hasColumn('institution_registration_requests', 'admin_setup_completed_at')) {
                $table->dropColumn('admin_setup_completed_at');
            }
            if (Schema::hasColumn('institution_registration_requests', 'admin_setup_token_expires_at')) {
                $table->dropColumn('admin_setup_token_expires_at');
            }
            if (Schema::hasColumn('institution_registration_requests', 'admin_setup_token_hash')) {
                $table->dropColumn('admin_setup_token_hash');
            }
        });
    }
}
