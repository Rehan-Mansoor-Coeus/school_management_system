<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLettersAndAnnouncementsTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('letter_settings')) {
            Schema::create('letter_settings', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->string('company_name')->nullable();
                $table->string('letterhead_path')->nullable();
                $table->string('footer_path')->nullable();
                $table->string('logo_path')->nullable();
                $table->string('default_signer_title')->nullable();
                $table->text('default_footer_text')->nullable();
                $table->string('serial_prefix')->nullable();
                $table->unsignedInteger('serial_counter')->default(0);
                $table->timestamps();
                $table->unique('institution_id');
            });
        }

        if (! Schema::hasTable('letter_categories')) {
            Schema::create('letter_categories', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->string('name');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('letter_templates')) {
            Schema::create('letter_templates', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('category_id')->nullable()->index();
                $table->string('name');
                $table->string('subject')->nullable();
                $table->longText('header_html')->nullable();
                $table->longText('body_html')->nullable();
                $table->longText('footer_html')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('letters')) {
            Schema::create('letters', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('category_id')->nullable()->index();
                $table->unsignedBigInteger('template_id')->nullable()->index();
                $table->string('reference')->nullable()->index();
                $table->string('people_type')->default('users');
                $table->string('author_name')->nullable();
                $table->string('subject');
                $table->longText('header_html')->nullable();
                $table->longText('body_html')->nullable();
                $table->longText('footer_html')->nullable();
                $table->string('status')->default('draft')->index();
                $table->text('comment')->nullable();
                $table->timestamp('scheduled_at')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->unsignedBigInteger('assigned_to')->nullable();
                $table->boolean('is_template')->default(false);
                $table->string('barcode_value')->nullable();
                $table->string('qr_code_value')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('letter_recipients')) {
            Schema::create('letter_recipients', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('letter_id')->index();
                $table->string('recipient_type')->default('custom');
                $table->unsignedBigInteger('recipient_id')->nullable();
                $table->string('name');
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->text('address')->nullable();
                $table->longText('personalized_body_html')->nullable();
                $table->json('placeholder_data')->nullable();
                $table->string('delivery_status')->default('pending');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('letter_cc_recipients')) {
            Schema::create('letter_cc_recipients', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('letter_id')->index();
                $table->string('recipient_type')->default('custom');
                $table->unsignedBigInteger('recipient_id')->nullable();
                $table->string('name');
                $table->string('email')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('letter_attachments')) {
            Schema::create('letter_attachments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('letter_id')->index();
                $table->string('original_name');
                $table->string('path');
                $table->string('mime_type')->nullable();
                $table->unsignedBigInteger('size')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('letter_comments')) {
            Schema::create('letter_comments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('letter_id')->index();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('role_stage')->nullable();
                $table->text('comment');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('letter_approvals')) {
            Schema::create('letter_approvals', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('letter_id')->index();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('action');
                $table->string('stage');
                $table->text('comment')->nullable();
                $table->string('signature_path')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('letter_status_histories')) {
            Schema::create('letter_status_histories', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('letter_id')->index();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('from_status')->nullable();
                $table->string('to_status');
                $table->text('note')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('user_signatures')) {
            Schema::create('user_signatures', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('signature_type');
                $table->string('signature_path');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('announcements')) {
            Schema::create('announcements', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->string('title');
                $table->longText('header_html')->nullable();
                $table->longText('body_html')->nullable();
                $table->longText('footer_html')->nullable();
                $table->string('audience_type')->default('all_users');
                $table->string('status')->default('draft')->index();
                $table->timestamp('scheduled_at')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->string('whatsapp_status')->default('pending');
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (! Schema::hasTable('announcement_recipients')) {
            Schema::create('announcement_recipients', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('announcement_id')->index();
                $table->string('recipient_type')->default('custom');
                $table->unsignedBigInteger('recipient_id')->nullable();
                $table->string('name');
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->json('placeholder_data')->nullable();
                $table->string('delivery_status')->default('pending');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('announcement_attachments')) {
            Schema::create('announcement_attachments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('announcement_id')->index();
                $table->string('original_name');
                $table->string('path');
                $table->string('mime_type')->nullable();
                $table->unsignedBigInteger('size')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('announcement_schedules')) {
            Schema::create('announcement_schedules', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('announcement_id')->index();
                $table->timestamp('scheduled_at');
                $table->string('status')->default('pending');
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('announcement_schedules');
        Schema::dropIfExists('announcement_attachments');
        Schema::dropIfExists('announcement_recipients');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('user_signatures');
        Schema::dropIfExists('letter_status_histories');
        Schema::dropIfExists('letter_approvals');
        Schema::dropIfExists('letter_comments');
        Schema::dropIfExists('letter_attachments');
        Schema::dropIfExists('letter_cc_recipients');
        Schema::dropIfExists('letter_recipients');
        Schema::dropIfExists('letters');
        Schema::dropIfExists('letter_templates');
        Schema::dropIfExists('letter_categories');
        Schema::dropIfExists('letter_settings');
    }
}
