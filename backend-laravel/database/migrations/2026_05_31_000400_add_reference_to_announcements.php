<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddReferenceToAnnouncements extends Migration
{
    public function up()
    {
        if (Schema::hasTable('announcements') && ! Schema::hasColumn('announcements', 'reference')) {
            Schema::table('announcements', function (Blueprint $table) {
                $table->string('reference')->nullable()->after('title')->index();
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('announcements') && Schema::hasColumn('announcements', 'reference')) {
            Schema::table('announcements', function (Blueprint $table) {
                $table->dropColumn('reference');
            });
        }
    }
}
