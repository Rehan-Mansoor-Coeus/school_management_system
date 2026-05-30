<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterTemplate extends Model
{
    protected $fillable = [
        'institution_id', 'category_id', 'name', 'subject', 'header_html', 'body_html',
        'footer_html', 'is_active', 'created_by',
    ];

    public function category()
    {
        return $this->belongsTo(LetterCategory::class, 'category_id');
    }
}
