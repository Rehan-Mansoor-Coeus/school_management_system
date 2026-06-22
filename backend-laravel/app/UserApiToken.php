<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class UserApiToken extends Model
{
    protected $fillable = [
        'user_id', 'token', 'label', 'last_used_at', 'expires_at',
    ];

    protected $dates = [
        'last_used_at', 'expires_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
