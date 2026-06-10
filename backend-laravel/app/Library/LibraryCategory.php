<?php

namespace App\Library;

use Illuminate\Database\Eloquent\Model;

class LibraryCategory extends Model
{
    protected $table = 'library_categories';

    protected $fillable = [
        'institution_id', 'name', 'description', 'status',
    ];

    public function books()
    {
        return $this->hasMany(LibraryBook::class, 'category_id');
    }
}
