<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ExtendAnnouncementsForWasender extends Migration
{
    public function up()
    {
        if (Schema::hasTable('announcements')) {
            Schema::table('announcements', function (Blueprint $table) {
                if (! Schema::hasColumn('announcements', 'category')) {
                    $table->string('category')->default('general')->after('title');
                }
                if (! Schema::hasColumn('announcements', 'attachment_path')) {
                    $table->string('attachment_path')->nullable()->after('footer_html');
                }
            });
        }

        if (Schema::hasTable('announcement_recipients')) {
            Schema::table('announcement_recipients', function (Blueprint $table) {
                if (! Schema::hasColumn('announcement_recipients', 'address')) {
                    $table->text('address')->nullable()->after('phone');
                }
                if (! Schema::hasColumn('announcement_recipients', 'personalized_message')) {
                    $table->longText('personalized_message')->nullable()->after('placeholder_data');
                }
            });
        }

        if (Schema::hasTable('announcement_logs')) {
            Schema::table('announcement_logs', function (Blueprint $table) {
                if (! Schema::hasColumn('announcement_logs', 'attachment_path')) {
                    $table->string('attachment_path')->nullable()->after('message');
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('announcement_logs') && Schema::hasColumn('announcement_logs', 'attachment_path')) {
            Schema::table('announcement_logs', function (Blueprint $table) {
                $table->dropColumn('attachment_path');
            });
        }

        if (Schema::hasTable('announcement_recipients')) {
            Schema::table('announcement_recipients', function (Blueprint $table) {
                if (Schema::hasColumn('announcement_recipients', 'personalized_message')) {
                    $table->dropColumn('personalized_message');
                }
                if (Schema::hasColumn('announcement_recipients', 'address')) {
                    $table->dropColumn('address');
                }
            });
        }

        if (Schema::hasTable('announcements')) {
            Schema::table('announcements', function (Blueprint $table) {
                if (Schema::hasColumn('announcements', 'attachment_path')) {
                    $table->dropColumn('attachment_path');
                }
                if (Schema::hasColumn('announcements', 'category')) {
                    $table->dropColumn('category');
                }
            });
        }
    }
}
