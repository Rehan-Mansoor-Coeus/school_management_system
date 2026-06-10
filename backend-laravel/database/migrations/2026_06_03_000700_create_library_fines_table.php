<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibraryFinesTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_fines')) {
            Schema::create('library_fines', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('borrow_request_id')->nullable()->index();
                $table->unsignedBigInteger('borrow_transaction_id')->nullable()->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->unsignedBigInteger('book_id')->nullable();
                $table->integer('overdue_days')->default(0);
                $table->decimal('fine_amount', 10, 2)->default(0);
                $table->string('status')->default('unpaid')->index(); // unpaid, paid, waived
                $table->timestamp('payment_date')->nullable();
                $table->unsignedBigInteger('waived_by')->nullable();
                $table->unsignedBigInteger('paid_by')->nullable();
                $table->text('comment')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('library_fines');
    }
}
