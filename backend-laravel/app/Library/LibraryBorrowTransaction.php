<?php

namespace App\Library;

use App\User;
use Illuminate\Database\Eloquent\Model;

class LibraryBorrowTransaction extends Model
{
    protected $table = 'library_borrow_transactions';

    protected $fillable = [
        'institution_id', 'borrow_request_id', 'user_id', 'book_id', 'book_copy_id',
        'issue_date', 'due_date', 'return_date', 'status', 'fine_amount',
        'issued_by', 'returned_by',
    ];

    protected $casts = [
        'issue_date' => 'datetime',
        'due_date' => 'date',
        'return_date' => 'datetime',
        'fine_amount' => 'float',
    ];

    const STATUS_BORROWED = 'borrowed';
    const STATUS_RETURNED = 'returned';
    const STATUS_OVERDUE = 'overdue';
    const STATUS_LOST = 'lost';

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function book()
    {
        return $this->belongsTo(LibraryBook::class, 'book_id');
    }

    public function copy()
    {
        return $this->belongsTo(LibraryBookCopy::class, 'book_copy_id');
    }

    public function request()
    {
        return $this->belongsTo(LibraryBorrowRequest::class, 'borrow_request_id');
    }
}
