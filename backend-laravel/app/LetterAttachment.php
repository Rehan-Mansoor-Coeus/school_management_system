<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterAttachment extends Model
{
    protected $fillable = [
        'institution_id', 'letter_id', 'original_name', 'path', 'mime_type', 'size',
    ];
}
