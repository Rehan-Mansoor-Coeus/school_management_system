<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterStatusHistory extends Model
{
    protected $fillable = [
        'institution_id', 'letter_id', 'user_id', 'from_status', 'to_status', 'note',
    ];
}
