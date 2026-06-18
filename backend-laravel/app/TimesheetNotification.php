<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetNotification extends Model
{
    protected $fillable = [
        'institution_id', 'user_id', 'channel', 'event_key', 'locale',
        'title', 'message', 'payload', 'read_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'read_at' => 'datetime',
    ];
}
