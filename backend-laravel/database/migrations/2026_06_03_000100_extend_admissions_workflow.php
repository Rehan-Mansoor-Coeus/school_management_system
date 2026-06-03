<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ExtendAdmissionsWorkflow extends Migration
{
    public function up()
    {
        if (Schema::hasTable('applications')) {
            Schema::table('applications', function (Blueprint $table) {
                if (! Schema::hasColumn('applications', 'registry_reviewed_by')) {
                    $table->unsignedBigInteger('registry_reviewed_by')->nullable()->after('reviewed_at');
                    $table->timestamp('registry_reviewed_at')->nullable()->after('registry_reviewed_by');
                    $table->unsignedBigInteger('department_reviewed_by')->nullable()->after('registry_reviewed_at');
                    $table->timestamp('department_reviewed_at')->nullable()->after('department_reviewed_by');
                    $table->text('department_review_comment')->nullable()->after('department_reviewed_at');
                    $table->decimal('tuition_fee', 12, 2)->default(0)->after('application_fee');
                    $table->boolean('tuition_fee_paid')->default(false)->after('tuition_fee');
                    $table->timestamp('tuition_paid_at')->nullable()->after('tuition_fee_paid');
                    $table->unsignedBigInteger('tuition_verified_by')->nullable()->after('tuition_paid_at');
                    $table->timestamp('tuition_verified_at')->nullable()->after('tuition_verified_by');
                }
            });

            // Widen status column to support full workflow statuses.
            DB::statement("ALTER TABLE applications MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft'");
        }

        if (Schema::hasTable('payments') && ! Schema::hasColumn('payments', 'application_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->unsignedBigInteger('application_id')->nullable()->after('fee_id');
                $table->index('application_id');
            });
        }

        if (Schema::hasTable('programmes') && ! Schema::hasColumn('programmes', 'application_fee')) {
            Schema::table('programmes', function (Blueprint $table) {
                $table->decimal('application_fee', 12, 2)->default(0)->after('tuition_fee');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('applications')) {
            Schema::table('applications', function (Blueprint $table) {
                $columns = [
                    'registry_reviewed_by', 'registry_reviewed_at',
                    'department_reviewed_by', 'department_reviewed_at', 'department_review_comment',
                    'tuition_fee', 'tuition_fee_paid', 'tuition_paid_at',
                    'tuition_verified_by', 'tuition_verified_at',
                ];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('applications', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('payments') && Schema::hasColumn('payments', 'application_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropColumn('application_id');
            });
        }

        if (Schema::hasTable('programmes') && Schema::hasColumn('programmes', 'application_fee')) {
            Schema::table('programmes', function (Blueprint $table) {
                $table->dropColumn('application_fee');
            });
        }
    }
}
