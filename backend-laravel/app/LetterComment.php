<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterComment extends Model
{
    protected $fillable = [
        'institution_id', 'letter_id', 'user_id', 'role_stage', 'comment',
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
