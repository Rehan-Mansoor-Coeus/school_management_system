<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLegacyLibraryBooksTable extends Migration
{
    public function up()
    {
        Schema::create('library_books', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->string('isbn')->nullable()->unique();
            $table->string('call_number')->unique();
            $table->string('title');
            $table->string('author');
            $table->string('publisher')->nullable();
            $table->year('publication_year')->nullable();
            $table->string('edition')->nullable();
            $table->text('description')->nullable();
            $table->enum('category', ['textbook', 'reference', 'fiction', 'non_fiction', 'journal', 'thesis'])->default('textbook');
            $table->integer('copies_total')->default(1);
            $table->integer('copies_available')->default(1);
            $table->integer('copies_borrowed')->default(0);
            $table->decimal('price', 12, 2)->default(0);
            $table->string('location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('call_number');
            $table->index('title');
            $table->index('author');
            $table->index('category');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('library_books');
    }
}
