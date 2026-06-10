<?php

namespace App\Library;

use App\User;
use Illuminate\Database\Eloquent\Model;

class LibraryBorrowRequest extends Model
{
    protected $table = 'library_borrow_requests';

    protected $fillable = [
        'institution_id', 'user_id', 'book_id', 'book_copy_id',
        'requested_from_datetime', 'requested_to_datetime', 'expected_return_date',
        'status', 'token', 'requested_at', 'approved_by', 'approved_at',
        'rejected_by', 'rejected_reason', 'issued_by', 'issued_at',
        'returned_by', 'returned_at',
    ];

    protected $casts = [
        'requested_from_datetime' => 'datetime',
        'requested_to_datetime' => 'datetime',
        'expected_return_date' => 'date',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'issued_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_ISSUED = 'issued';
    const STATUS_RETURNED = 'returned';
    const STATUS_CANCELLED = 'cancelled';

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

    public function transaction()
    {
        return $this->hasOne(LibraryBorrowTransaction::class, 'borrow_request_id');
    }

    public function fine()
    {
        return $this->hasOne(LibraryFine::class, 'borrow_request_id');
    }
}
