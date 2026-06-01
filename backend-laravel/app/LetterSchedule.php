<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class LetterSchedule extends Model
{
    protected $fillable = [
        'institution_id', 'letter_id', 'scheduled_at', 'status', 'sent_at',
    ];

    protected $dates = ['scheduled_at', 'sent_at'];

    public function letter()
    {
        return $this->belongsTo(Letter::class);
    }
}
