<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterCcRecipient extends Model
{
    protected $fillable = [
        'institution_id', 'letter_id', 'recipient_type', 'recipient_id', 'name', 'email',
    ];
}
