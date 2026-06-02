<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddCategoryAndRoleIdsToUsers extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'category')) {
                $table->string('category')->nullable()->index()->after('status');
            }
            if (! Schema::hasColumn('users', 'role_ids')) {
                $table->json('role_ids')->nullable()->after('category');
            }
        });

        // People (students/teachers/staff) may not have an email, so relax the NOT NULL
        // constraint. Email stays UNIQUE, and MySQL allows multiple NULLs in a unique index.
        DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NULL');

        // Existing rows are real login accounts -> tag them as the "user" category so they
        // keep showing up in the Users lists and stay out of the people lists.
        DB::table('users')->whereNull('category')->update(['category' => 'user']);
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role_ids')) {
                $table->dropColumn('role_ids');
            }
            if (Schema::hasColumn('users', 'category')) {
                $table->dropColumn('category');
            }
        });
    }
}
