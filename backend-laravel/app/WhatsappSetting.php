<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class WhatsappSetting extends Model
{
    protected $fillable = [
        'institution_id', 'enabled', 'provider', 'base_url', 'session_id',
        'otp_enabled', 'otp_expiry_seconds', 'otp_resend_cooldown_seconds',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'otp_enabled' => 'boolean',
    ];
}
