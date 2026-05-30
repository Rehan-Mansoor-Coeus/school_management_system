<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AnnouncementLog extends Model
{
    protected $fillable = [
        'institution_id', 'announcement_id', 'recipient_id', 'provider', 'phone_number',
        'message', 'content_sid', 'content_variables', 'status', 'provider_response', 'error_message',
    ];
}
