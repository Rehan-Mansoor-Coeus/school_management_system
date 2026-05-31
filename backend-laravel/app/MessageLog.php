<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MessageLog extends Model
{
    protected $fillable = [
        'institution_id', 'recipient_name', 'phone_number', 'message_type', 'module',
        'related_id', 'message', 'attachment_url', 'status', 'api_response',
        'error_message', 'sent_at',
    ];

    protected $dates = ['sent_at'];
}
