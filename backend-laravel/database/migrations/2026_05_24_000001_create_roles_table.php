<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRolesTable extends Migration
{
    public function up()
    {
        Schema::dropIfExists('roles');

        Schema::create('roles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('guard_name')->default('api');
            $table->timestamps();

            $table->unique(['name', 'guard_name']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('roles');
    }
}
