<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLibraryBorrowRequestsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_borrow_requests')) {
            Schema::create('library_borrow_requests', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->unsignedBigInteger('book_id')->index();
                $table->unsignedBigInteger('book_copy_id')->nullable()->index();
                $table->dateTime('requested_from_datetime')->nullable();
                $table->dateTime('requested_to_datetime')->nullable();
                $table->date('expected_return_date')->nullable();
                // pending, approved, rejected, issued, returned, cancelled
                $table->string('status')->default('pending')->index();
                $table->string('token')->nullable()->unique();
                $table->timestamp('requested_at')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->unsignedBigInteger('rejected_by')->nullable();
                $table->text('rejected_reason')->nullable();
                $table->unsignedBigInteger('issued_by')->nullable();
                $table->timestamp('issued_at')->nullable();
                $table->unsignedBigInteger('returned_by')->nullable();
                $table->timestamp('returned_at')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('book_id')->references('id')->on('library_books')->onDelete('cascade');
                $table->foreign('book_copy_id')->references('id')->on('library_book_copies')->onDelete('set null');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('library_borrow_requests');
    }
}
