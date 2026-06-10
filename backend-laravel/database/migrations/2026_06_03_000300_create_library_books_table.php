<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibraryBooksTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_books')) {
            Schema::create('library_books', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('category_id')->nullable()->index();
                $table->string('title');
                $table->string('isbn')->nullable()->index();
                $table->string('author')->nullable();
                $table->string('publisher')->nullable();
                $table->string('publication_year')->nullable();
                $table->string('edition')->nullable();
                $table->text('description')->nullable();
                $table->string('cover_image_path')->nullable();
                $table->string('language')->nullable();
                $table->string('shelf_location')->nullable();
                $table->string('status')->default('active')->index();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('category_id')->references('id')->on('library_categories')->onDelete('set null');
                $table->index(['institution_id', 'title']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('library_books');
    }
}
