<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibraryBookCopiesTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_book_copies')) {
            Schema::create('library_book_copies', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('book_id')->index();
                $table->string('copy_code');
                $table->string('barcode')->nullable();
                $table->string('shelf_location')->nullable();
                $table->string('condition')->default('good'); // new, good, damaged, lost
                $table->string('status')->default('available')->index(); // available, requested, borrowed, reserved, overdue, lost, damaged
                $table->unsignedBigInteger('current_borrower_id')->nullable();
                $table->date('expected_available_date')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('book_id')->references('id')->on('library_books')->onDelete('cascade');
                $table->foreign('current_borrower_id')->references('id')->on('users')->onDelete('set null');
                $table->unique(['institution_id', 'copy_code']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('library_book_copies');
    }
}
