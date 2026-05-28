<?php

namespace App;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use Notifiable, HasRoles;

    protected $guard_name = 'api';

    protected $fillable = [
        'institution_id', 'name', 'email', 'password', 'api_token',
        'hourly_rate', 'department_id', 'campus_id', 'locale',
    ];

    protected $hidden = [
        'password', 'remember_token', 'api_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}
