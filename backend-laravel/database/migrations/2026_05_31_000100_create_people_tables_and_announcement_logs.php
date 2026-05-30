<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePeopleTablesAndAnnouncementLogs extends Migration
{
    public function up()
    {
        foreach (['customers', 'billers', 'suppliers'] as $table) {
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
                    $table->timestamps();
                });
            }
        }

        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('status')->default('active')->after('additional_phone_number');
            });
        }

        if (Schema::hasTable('announcement_recipients')) {
            Schema::table('announcement_recipients', function (Blueprint $table) {
                if (! Schema::hasColumn('announcement_recipients', 'error_message')) {
                    $table->text('error_message')->nullable()->after('delivery_status');
                }
                if (! Schema::hasColumn('announcement_recipients', 'sent_at')) {
                    $table->timestamp('sent_at')->nullable()->after('error_message');
                }
            });
        }

        if (! Schema::hasTable('announcement_logs')) {
            Schema::create('announcement_logs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('announcement_id')->index();
                $table->unsignedBigInteger('recipient_id')->nullable()->index();
                $table->string('provider')->default('twilio');
                $table->string('phone_number');
                $table->text('message');
                $table->string('status')->default('pending')->index();
                $table->text('provider_response')->nullable();
                $table->text('error_message')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('announcement_logs');

        if (Schema::hasTable('announcement_recipients')) {
            Schema::table('announcement_recipients', function (Blueprint $table) {
                if (Schema::hasColumn('announcement_recipients', 'error_message')) {
                    $table->dropColumn('error_message');
                }
                if (Schema::hasColumn('announcement_recipients', 'sent_at')) {
                    $table->dropColumn('sent_at');
                }
            });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }

        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('billers');
        Schema::dropIfExists('customers');
    }
}
