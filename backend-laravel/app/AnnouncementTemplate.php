<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AnnouncementTemplate extends Model
{
    protected $fillable = [
        'institution_id', 'name', 'category', 'subject', 'header_html', 'body_html', 'footer_html', 'is_active', 'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
