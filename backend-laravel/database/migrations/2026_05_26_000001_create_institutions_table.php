<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInstitutionsTable extends Migration
{
    public function up()
    {
        Schema::create('institutions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->unique();
            $table->string('code')->unique();
            $table->string('acronym')->nullable();
            $table->text('description')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('letterhead_path')->nullable();
            $table->string('registrar_signature_path')->nullable();
            $table->text('mission')->nullable();
            $table->text('vision')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('institutions');
    }
}