<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCanteenWalletsTable extends Migration
{
    public function up()
    {
        Schema::create('canteen_wallets', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('student_id');
            $table->string('wallet_number')->unique();
            $table->decimal('balance', 12, 2)->default(0);
            $table->decimal('total_credit', 12, 2)->default(0);
            $table->decimal('total_spent', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->index('institution_id');
            $table->index('student_id');
            $table->index('wallet_number');
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('canteen_wallets');
    }
}
