<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateHostelsTable extends Migration
{
    public function up()
    {
        Schema::create('hostels', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->string('name')->unique();
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->enum('gender', ['male', 'female', 'mixed'])->default('mixed');
            $table->string('location')->nullable();
            $table->string('caretaker_phone')->nullable();
            $table->string('caretaker_email')->nullable();
            $table->integer('total_rooms')->default(0);
            $table->integer('total_capacity')->default(0);
            $table->integer('occupied_capacity')->default(0);
            $table->decimal('room_fee', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('code');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('hostels');
    }
}
