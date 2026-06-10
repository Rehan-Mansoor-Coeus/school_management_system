<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibrarySettingsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_settings')) {
            Schema::create('library_settings', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->unique();
                $table->integer('max_borrow_days')->default(14);
                $table->integer('max_books_per_user')->default(3);
                $table->decimal('fine_per_day', 10, 2)->default(0);
                $table->integer('grace_period_days')->default(0);
                $table->boolean('allow_unlimited_borrowing')->default(false);
                $table->boolean('require_approval')->default(true);
                $table->boolean('isbn_mandatory')->default(false);
                $table->boolean('author_mandatory')->default(false);
                $table->boolean('shelf_location_mandatory')->default(false);
                $table->boolean('publisher_mandatory')->default(false);
                $table->boolean('publication_year_mandatory')->default(false);
                $table->integer('default_reminder_days')->default(2);
                $table->boolean('whatsapp_notifications_enabled')->default(true);
                $table->boolean('email_notifications_enabled')->default(false);
                $table->boolean('block_borrow_on_unpaid_fines')->default(false);
                $table->json('librarian_user_ids')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('library_settings');
    }
}
