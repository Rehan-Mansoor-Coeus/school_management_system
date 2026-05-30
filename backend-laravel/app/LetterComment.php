<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterComment extends Model
{
    protected $fillable = [
        'institution_id', 'letter_id', 'user_id', 'role_stage', 'comment',
    ];
}
