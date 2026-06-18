<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ExtendTimesheetApprovalsTable extends Migration
{
    public function up()
    {
        Schema::table('timesheet_approvals', function (Blueprint $table) {
            if (!Schema::hasColumn('timesheet_approvals', 'timesheet_entry_id')) {
                $table->unsignedBigInteger('timesheet_entry_id')->nullable()->after('timesheet_id');
            }
            if (!Schema::hasColumn('timesheet_approvals', 'timesheet_type')) {
                $table->string('timesheet_type', 20)->nullable()->after('timesheet_entry_id');
            }
            if (!Schema::hasColumn('timesheet_approvals', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('timesheet_type');
            }
            if (!Schema::hasColumn('timesheet_approvals', 'status')) {
                $table->string('status', 30)->nullable()->after('approved_by');
            }
            if (!Schema::hasColumn('timesheet_approvals', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('status');
            }
        });

        if (Schema::hasColumn('timesheet_approvals', 'timesheet_id')) {
            try {
                Schema::table('timesheet_approvals', function (Blueprint $table) {
                    $table->dropForeign(['timesheet_id']);
                });
            } catch (\Exception $exception) {
                // Foreign key may already be removed in some environments.
            }

            if (Schema::getConnection()->getDriverName() === 'mysql') {
                DB::statement('ALTER TABLE timesheet_approvals MODIFY timesheet_id BIGINT UNSIGNED NULL');
            }
        }
    }

    public function down()
    {
        Schema::table('timesheet_approvals', function (Blueprint $table) {
            $columns = ['timesheet_entry_id', 'timesheet_type', 'approved_by', 'status', 'approved_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('timesheet_approvals', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}
