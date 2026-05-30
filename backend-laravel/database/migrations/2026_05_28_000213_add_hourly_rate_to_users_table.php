<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddHourlyRateToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'hourly_rate')) {
                $table->decimal('hourly_rate', 10, 2)->nullable()->after('institution_id');
            }
            if (!Schema::hasColumn('users', 'department_id')) {
                $table->unsignedBigInteger('department_id')->nullable()->after('hourly_rate');
            }
            if (!Schema::hasColumn('users', 'campus_id')) {
                $table->unsignedBigInteger('campus_id')->nullable()->after('department_id');
            }
            if (!Schema::hasColumn('users', 'locale')) {
                $table->string('locale', 5)->default('en')->after('campus_id');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['hourly_rate', 'department_id', 'campus_id', 'locale'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}
