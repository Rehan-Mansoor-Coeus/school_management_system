<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAnnouncementTemplatesTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('announcement_templates')) {
            Schema::create('announcement_templates', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->string('name');
                $table->string('category')->default('general');
                $table->string('subject')->nullable();
                $table->longText('header_html')->nullable();
                $table->longText('body_html')->nullable();
                $table->longText('footer_html')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('announcement_templates');
    }
}
