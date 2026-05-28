<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ExtendTimesheetEntriesForEmployeeFlow extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('timesheet_entries')) {
            return;
        }

        Schema::table('timesheet_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('timesheet_entries', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('institution_id');
                $table->index(['institution_id', 'user_id']);
            }
            if (!Schema::hasColumn('timesheet_entries', 'minutes')) {
                $table->unsignedInteger('minutes')->nullable()->after('hours_worked');
            }
            if (!Schema::hasColumn('timesheet_entries', 'notes')) {
                $table->text('notes')->nullable()->after('description');
            }
            if (!Schema::hasColumn('timesheet_entries', 'status')) {
                $table->string('status', 30)->default('pending')->after('notes');
            }
            if (!Schema::hasColumn('timesheet_entries', 'is_overtime')) {
                $table->boolean('is_overtime')->default(false)->after('status');
            }
            if (!Schema::hasColumn('timesheet_entries', 'overtime_hours')) {
                $table->decimal('overtime_hours', 5, 2)->default(0)->after('is_overtime');
            }
            if (!Schema::hasColumn('timesheet_entries', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('overtime_hours');
            }
            if (!Schema::hasColumn('timesheet_entries', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
            if (!Schema::hasColumn('timesheet_entries', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('approved_at');
            }
        });

        if (Schema::hasColumn('timesheet_entries', 'timesheet_id')) {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE timesheet_entries MODIFY timesheet_id BIGINT UNSIGNED NULL');
        }
    }

    public function down()
    {
        if (!Schema::hasTable('timesheet_entries')) {
            return;
        }

        Schema::table('timesheet_entries', function (Blueprint $table) {
            foreach (['user_id', 'minutes', 'notes', 'status', 'is_overtime', 'overtime_hours', 'approved_by', 'approved_at', 'rejection_reason'] as $column) {
                if (Schema::hasColumn('timesheet_entries', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}
