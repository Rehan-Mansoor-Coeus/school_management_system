<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class AnnouncementRecipient extends Model
{
    protected $fillable = [
        'institution_id', 'announcement_id', 'recipient_type', 'recipient_id', 'name', 'email',
        'phone', 'address', 'placeholder_data', 'personalized_message', 'delivery_status', 'error_message', 'sent_at',
    ];

    protected $casts = ['placeholder_data' => 'array'];
}
