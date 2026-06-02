<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPeopleTeachersStaffRolesAndUserAddress extends Migration
{
    public function up()
    {
        foreach (['people_students'] as $table) {
            if (Schema::hasTable($table) && ! Schema::hasColumn($table, 'role_ids')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->json('role_ids')->nullable()->after('status');
                });
            }
        }

        foreach (['people_teachers', 'people_staff'] as $table) {
            if (! Schema::hasTable($table)) {
                Schema::create($table, function (Blueprint $table) {
                    $table->bigIncrements('id');
                    $table->unsignedBigInteger('institution_id')->index();
                    $table->string('name');
                    $table->string('email')->nullable();
                    $table->string('phone_number');
                    $table->string('additional_phone_number')->nullable();
                    $table->text('address')->nullable();
                    $table->string('status')->default('active')->index();
                    $table->json('role_ids')->nullable();
                    $table->timestamps();
                });
            }
        }

        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'address')) {
            Schema::table('users', function (Blueprint $table) {
                $table->text('address')->nullable()->after('additional_phone_number');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('people_students') && Schema::hasColumn('people_students', 'role_ids')) {
            Schema::table('people_students', function (Blueprint $table) {
                $table->dropColumn('role_ids');
            });
        }

        Schema::dropIfExists('people_teachers');
        Schema::dropIfExists('people_staff');

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'address')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('address');
            });
        }
    }
}
