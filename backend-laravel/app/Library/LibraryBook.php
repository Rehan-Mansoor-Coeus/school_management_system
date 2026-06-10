<?php

namespace App\Library;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class LibraryBook extends Model
{
    protected $table = 'library_books';

    protected $fillable = [
        'institution_id', 'category_id', 'title', 'isbn', 'author', 'publisher',
        'publication_year', 'edition', 'description', 'cover_image_path',
        'language', 'shelf_location', 'status', 'created_by',
    ];

    public function getCoverImageUrlAttribute(): ?string
    {
        if (! $this->cover_image_path) {
            return null;
        }

        return rtrim((string) config('app.url'), '/').'/storage/'.ltrim($this->cover_image_path, '/');
    }

    /**
     * Named bookCategory (not category) because legacy library_books has a
     * string/enum "category" column that would shadow a category() relation.
     */
    public function bookCategory()
    {
        return $this->belongsTo(LibraryCategory::class, 'category_id');
    }

    public function copies()
    {
        return $this->hasMany(LibraryBookCopy::class, 'book_id');
    }

    public function reviews()
    {
        return $this->hasMany(LibraryBookReview::class, 'book_id');
    }
}
