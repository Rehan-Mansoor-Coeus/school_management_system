<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPhoneNumbersToUsersTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'phone_number')) {
                    $table->string('phone_number')->nullable()->after('email');
                }
                if (! Schema::hasColumn('users', 'additional_phone_number')) {
                    $table->string('additional_phone_number')->nullable()->after('phone_number');
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'additional_phone_number')) {
                    $table->dropColumn('additional_phone_number');
                }
                if (Schema::hasColumn('users', 'phone_number')) {
                    $table->dropColumn('phone_number');
                }
            });
        }
    }
}
