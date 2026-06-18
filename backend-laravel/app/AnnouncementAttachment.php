<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AnnouncementAttachment extends Model
{
    protected $fillable = [
        'institution_id', 'announcement_id', 'original_name', 'path', 'mime_type', 'size',
    ];
}
