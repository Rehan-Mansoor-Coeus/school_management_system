<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMessagingOtpAndQueueTables extends Migration
{
    public function up()
    {
        if (Schema::hasTable('letters')) {
            Schema::table('letters', function (Blueprint $table) {
                if (! Schema::hasColumn('letters', 'otp')) {
                    $table->string('otp', 10)->nullable()->after('qr_code_value');
                }
                if (! Schema::hasColumn('letters', 'otp_time')) {
                    $table->timestamp('otp_time')->nullable()->after('otp');
                }
                if (! Schema::hasColumn('letters', 'otp_verified')) {
                    $table->boolean('otp_verified')->default(false)->after('otp_time');
                }
                if (! Schema::hasColumn('letters', 'approved_by')) {
                    $table->unsignedBigInteger('approved_by')->nullable()->after('updated_by');
                }
                if (! Schema::hasColumn('letters', 'signed_by')) {
                    $table->unsignedBigInteger('signed_by')->nullable()->after('approved_by');
                }
                if (! Schema::hasColumn('letters', 'sent_by')) {
                    $table->unsignedBigInteger('sent_by')->nullable()->after('signed_by');
                }
                if (! Schema::hasColumn('letters', 'rejected_by')) {
                    $table->unsignedBigInteger('rejected_by')->nullable()->after('sent_by');
                }
                if (! Schema::hasColumn('letters', 'edit_by')) {
                    $table->unsignedBigInteger('edit_by')->nullable()->after('rejected_by');
                }
            });
        }

        if (Schema::hasTable('announcements')) {
            Schema::table('announcements', function (Blueprint $table) {
                if (! Schema::hasColumn('announcements', 'otp')) {
                    $table->string('otp', 10)->nullable();
                }
                if (! Schema::hasColumn('announcements', 'otp_time')) {
                    $table->timestamp('otp_time')->nullable();
                }
                if (! Schema::hasColumn('announcements', 'sent_by')) {
                    $table->unsignedBigInteger('sent_by')->nullable();
                }
                if (! Schema::hasColumn('announcements', 'is_sent')) {
                    $table->boolean('is_sent')->default(false);
                }
                if (! Schema::hasColumn('announcements', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
            });
        }

        if (! Schema::hasTable('message_logs')) {
            Schema::create('message_logs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->string('recipient_name')->nullable();
                $table->string('phone_number')->nullable()->index();
                $table->string('message_type')->default('text')->index();
                $table->string('module')->nullable()->index();
                $table->unsignedBigInteger('related_id')->nullable()->index();
                $table->longText('message')->nullable();
                $table->string('attachment_url')->nullable();
                $table->string('status')->default('pending')->index();
                $table->longText('api_response')->nullable();
                $table->text('error_message')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('otp_logs')) {
            Schema::create('otp_logs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('module')->index();
                $table->unsignedBigInteger('related_id')->nullable()->index();
                $table->string('action')->index();
                $table->string('otp', 10);
                $table->string('phone_number')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamp('verified_at')->nullable();
                $table->string('status')->default('pending')->index();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('whatsapp_settings')) {
            Schema::create('whatsapp_settings', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->unique();
                $table->boolean('enabled')->default(true);
                $table->string('provider')->default('wasenderapi');
                $table->string('base_url')->nullable();
                $table->string('session_id')->nullable();
                $table->boolean('otp_enabled')->default(true);
                $table->unsignedSmallInteger('otp_expiry_seconds')->default(180);
                $table->unsignedSmallInteger('otp_resend_cooldown_seconds')->default(60);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('message_queue')) {
            Schema::create('message_queue', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->string('module')->index();
                $table->unsignedBigInteger('related_id')->index();
                $table->unsignedBigInteger('recipient_id')->nullable()->index();
                $table->json('payload')->nullable();
                $table->timestamp('scheduled_at')->nullable()->index();
                $table->string('status')->default('pending')->index();
                $table->unsignedTinyInteger('attempts')->default(0);
                $table->text('last_error')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('jobs')) {
            Schema::create('jobs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('queue')->index();
                $table->longText('payload');
                $table->unsignedTinyInteger('attempts');
                $table->unsignedInteger('reserved_at')->nullable();
                $table->unsignedInteger('available_at');
                $table->unsignedInteger('created_at');
            });
        }

        if (! Schema::hasTable('failed_jobs')) {
            Schema::create('failed_jobs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->text('connection');
                $table->text('queue');
                $table->longText('payload');
                $table->longText('exception');
                $table->timestamp('failed_at')->useCurrent();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('message_queue');
        Schema::dropIfExists('whatsapp_settings');
        Schema::dropIfExists('otp_logs');
        Schema::dropIfExists('message_logs');

        if (Schema::hasTable('announcements')) {
            Schema::table('announcements', function (Blueprint $table) {
                foreach (['otp', 'otp_time', 'sent_by', 'is_sent', 'is_active'] as $col) {
                    if (Schema::hasColumn('announcements', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('letters')) {
            Schema::table('letters', function (Blueprint $table) {
                foreach (['otp', 'otp_time', 'otp_verified', 'approved_by', 'signed_by', 'sent_by', 'rejected_by', 'edit_by'] as $col) {
                    if (Schema::hasColumn('letters', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
}
