<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class OtpLog extends Model
{
    protected $fillable = [
        'institution_id', 'user_id', 'module', 'related_id', 'action', 'otp',
        'phone_number', 'sent_at', 'expires_at', 'verified_at', 'status',
    ];

    protected $dates = ['sent_at', 'expires_at', 'verified_at'];
}
