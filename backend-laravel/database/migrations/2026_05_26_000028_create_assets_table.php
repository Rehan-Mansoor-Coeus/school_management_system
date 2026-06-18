<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAssetsTable extends Migration
{
    public function up()
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('asset_category_id');
            $table->string('asset_tag')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('serial_number')->nullable()->unique();
            $table->date('acquisition_date');
            $table->decimal('acquisition_cost', 12, 2);
            $table->decimal('current_value', 12, 2);
            $table->string('location')->nullable();
            $table->enum('condition', ['new', 'good', 'fair', 'poor', 'damaged'])->default('new');
            $table->enum('status', ['active', 'inactive', 'disposed', 'lost'])->default('active');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('asset_category_id')->references('id')->on('asset_categories')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('asset_category_id');
            $table->index('asset_tag');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('assets');
    }
}
