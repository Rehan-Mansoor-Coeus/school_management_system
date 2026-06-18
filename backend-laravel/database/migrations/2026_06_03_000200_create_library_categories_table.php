<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibraryCategoriesTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_categories')) {
            Schema::create('library_categories', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('status')->default('active')->index();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->index(['institution_id', 'name']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('library_categories');
    }
}
