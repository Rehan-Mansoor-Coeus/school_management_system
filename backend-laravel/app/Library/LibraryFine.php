<?php

namespace App\Library;

use App\User;
use Illuminate\Database\Eloquent\Model;

class LibraryFine extends Model
{
    protected $table = 'library_fines';

    protected $fillable = [
        'institution_id', 'borrow_request_id', 'borrow_transaction_id', 'user_id',
        'book_id', 'overdue_days', 'fine_amount', 'status', 'payment_date',
        'waived_by', 'paid_by', 'comment',
    ];

    protected $casts = [
        'overdue_days' => 'integer',
        'fine_amount' => 'float',
        'payment_date' => 'datetime',
    ];

    const STATUS_UNPAID = 'unpaid';
    const STATUS_PAID = 'paid';
    const STATUS_WAIVED = 'waived';

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function book()
    {
        return $this->belongsTo(LibraryBook::class, 'book_id');
    }

    public function request()
    {
        return $this->belongsTo(LibraryBorrowRequest::class, 'borrow_request_id');
    }
}
