<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MessageQueue extends Model
{
    protected $table = 'message_queue';

    protected $fillable = [
        'institution_id', 'module', 'related_id', 'recipient_id', 'payload',
        'scheduled_at', 'status', 'attempts', 'last_error',
    ];

    protected $dates = ['scheduled_at'];

    protected $casts = [
        'payload' => 'array',
    ];
}
