<?php

namespace App\Library;

use App\User;
use Illuminate\Database\Eloquent\Model;

class LibraryBookReview extends Model
{
    protected $table = 'library_book_reviews';

    protected $fillable = [
        'institution_id', 'book_id', 'user_id', 'borrow_request_id', 'rating', 'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function book()
    {
        return $this->belongsTo(LibraryBook::class, 'book_id');
    }
}
