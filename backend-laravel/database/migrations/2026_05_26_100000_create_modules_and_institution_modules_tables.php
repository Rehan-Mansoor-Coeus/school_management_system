<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateModulesAndInstitutionModulesTables extends Migration
{
    public function up()
    {
        Schema::create('modules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('sort_order');
            $table->index('is_active');
        });

        Schema::create('institution_modules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('module_id');
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('module_id')->references('id')->on('modules')->onDelete('cascade');
            $table->unique(['institution_id', 'module_id']);
            $table->index(['institution_id', 'enabled']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('institution_modules');
        Schema::dropIfExists('modules');
    }
}
