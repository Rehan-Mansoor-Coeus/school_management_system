<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterApproval extends Model
{
    protected $fillable = [
        'institution_id', 'letter_id', 'user_id', 'action', 'stage', 'comment', 'signature_path',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function letter()
    {
        return $this->belongsTo(Letter::class);
    }
}
