<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ExtendTimesheetActivitiesForEmployeeFlow extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('timesheet_activities')) {
            return;
        }

        Schema::table('timesheet_activities', function (Blueprint $table) {
            if (!Schema::hasColumn('timesheet_activities', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('institution_id');
                $table->index(['institution_id', 'user_id']);
            }
            if (!Schema::hasColumn('timesheet_activities', 'category_id')) {
                $table->unsignedBigInteger('category_id')->nullable()->after('user_id');
                $table->index('category_id');
            }
            if (!Schema::hasColumn('timesheet_activities', 'status')) {
                $table->string('status', 20)->default('active')->after('description');
            }
        });
    }

    public function down()
    {
        if (!Schema::hasTable('timesheet_activities')) {
            return;
        }

        Schema::table('timesheet_activities', function (Blueprint $table) {
            foreach (['user_id', 'category_id', 'status'] as $column) {
                if (Schema::hasColumn('timesheet_activities', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}
