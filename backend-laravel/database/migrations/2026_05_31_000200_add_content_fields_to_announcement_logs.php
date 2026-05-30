<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddContentFieldsToAnnouncementLogs extends Migration
{
    public function up()
    {
        if (Schema::hasTable('announcement_logs')) {
            Schema::table('announcement_logs', function (Blueprint $table) {
                if (! Schema::hasColumn('announcement_logs', 'content_sid')) {
                    $table->string('content_sid')->nullable()->after('message');
                }
                if (! Schema::hasColumn('announcement_logs', 'content_variables')) {
                    $table->text('content_variables')->nullable()->after('content_sid');
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('announcement_logs')) {
            Schema::table('announcement_logs', function (Blueprint $table) {
                if (Schema::hasColumn('announcement_logs', 'content_variables')) {
                    $table->dropColumn('content_variables');
                }
                if (Schema::hasColumn('announcement_logs', 'content_sid')) {
                    $table->dropColumn('content_sid');
                }
            });
        }
    }
}
