<?php

namespace App\Library;

use App\User;
use Illuminate\Database\Eloquent\Model;

class LibraryBookCopy extends Model
{
    protected $table = 'library_book_copies';

    protected $fillable = [
        'institution_id', 'book_id', 'copy_code', 'barcode', 'shelf_location',
        'condition', 'status', 'current_borrower_id', 'expected_available_date',
    ];

    protected $casts = [
        'expected_available_date' => 'date',
    ];

    const STATUS_AVAILABLE = 'available';
    const STATUS_REQUESTED = 'requested';
    const STATUS_BORROWED = 'borrowed';
    const STATUS_RESERVED = 'reserved';
    const STATUS_OVERDUE = 'overdue';
    const STATUS_LOST = 'lost';
    const STATUS_DAMAGED = 'damaged';

    public function book()
    {
        return $this->belongsTo(LibraryBook::class, 'book_id');
    }

    public function borrower()
    {
        return $this->belongsTo(User::class, 'current_borrower_id');
    }

    public function isBorrowable(): bool
    {
        return ! in_array($this->status, [self::STATUS_LOST, self::STATUS_DAMAGED], true)
            && ! in_array($this->condition, ['damaged', 'lost'], true);
    }
}
