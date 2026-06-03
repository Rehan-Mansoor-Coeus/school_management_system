<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AppNotification extends Model
{
    use SoftDeletes;

    protected $table = 'notifications';

    protected $fillable = [
        'institution_id', 'user_id', 'title', 'message', 'type', 'category',
        'link', 'is_read', 'read_at', 'is_sent_email', 'is_sent_sms', 'is_sent_whatsapp',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'is_sent_email' => 'boolean',
        'is_sent_sms' => 'boolean',
        'is_sent_whatsapp' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
