<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibraryBookReviewsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_book_reviews')) {
            Schema::create('library_book_reviews', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('book_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->unsignedBigInteger('borrow_request_id')->nullable();
                $table->unsignedTinyInteger('rating')->nullable(); // 1..5
                $table->text('comment')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('book_id')->references('id')->on('library_books')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->index(['book_id', 'user_id']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('library_book_reviews');
    }
}
