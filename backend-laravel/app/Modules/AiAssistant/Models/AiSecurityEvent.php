<?php

namespace App\Modules\AiAssistant\Models;

use Illuminate\Database\Eloquent\Model;

class AiSecurityEvent extends Model
{
    protected $table = 'ai_security_events';

    protected $fillable = [
        'event_type', 'user_id', 'institution_id', 'role_slug', 'snippet', 'ip_address',
    ];
}
