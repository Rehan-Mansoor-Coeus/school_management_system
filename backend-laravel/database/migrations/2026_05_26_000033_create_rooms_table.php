<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRoomsTable extends Migration
{
    public function up()
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('hostel_id');
            $table->string('room_number')->unique();
            $table->enum('room_type', ['single', 'double', 'triple', 'quad'])->default('double');
            $table->integer('capacity')->default(2);
            $table->integer('occupied_beds')->default(0);
            $table->enum('status', ['available', 'full', 'maintenance', 'closed'])->default('available');
            $table->decimal('monthly_fee', 12, 2);
            $table->text('facilities')->nullable();
            $table->string('floor_number')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('hostel_id')->references('id')->on('hostels')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('hostel_id');
            $table->index('room_number');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('rooms');
    }
}
