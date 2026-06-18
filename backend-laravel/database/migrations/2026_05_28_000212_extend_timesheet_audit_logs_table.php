<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ExtendTimesheetAuditLogsTable extends Migration
{
    public function up()
    {
        Schema::table('timesheet_audit_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('timesheet_audit_logs', 'entity_type')) {
                $table->string('entity_type', 60)->nullable()->after('entry_id');
            }
            if (!Schema::hasColumn('timesheet_audit_logs', 'entity_id')) {
                $table->unsignedBigInteger('entity_id')->nullable()->after('entity_type');
            }
        });
    }

    public function down()
    {
        Schema::table('timesheet_audit_logs', function (Blueprint $table) {
            if (Schema::hasColumn('timesheet_audit_logs', 'entity_type')) {
                $table->dropColumn('entity_type');
            }
            if (Schema::hasColumn('timesheet_audit_logs', 'entity_id')) {
                $table->dropColumn('entity_id');
            }
        });
    }
}
