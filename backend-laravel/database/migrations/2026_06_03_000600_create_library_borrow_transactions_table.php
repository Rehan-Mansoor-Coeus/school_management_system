<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibraryBorrowTransactionsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_borrow_transactions')) {
            Schema::create('library_borrow_transactions', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('borrow_request_id')->nullable()->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->unsignedBigInteger('book_id')->index();
                $table->unsignedBigInteger('book_copy_id')->nullable()->index();
                $table->dateTime('issue_date')->nullable();
                $table->date('due_date')->nullable();
                $table->dateTime('return_date')->nullable();
                $table->string('status')->default('borrowed')->index(); // borrowed, returned, overdue, lost
                $table->decimal('fine_amount', 10, 2)->default(0);
                $table->unsignedBigInteger('issued_by')->nullable();
                $table->unsignedBigInteger('returned_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('borrow_request_id')->references('id')->on('library_borrow_requests')->onDelete('set null');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('book_id')->references('id')->on('library_books')->onDelete('cascade');
                $table->foreign('book_copy_id')->references('id')->on('library_book_copies')->onDelete('set null');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('library_borrow_transactions');
    }
}
