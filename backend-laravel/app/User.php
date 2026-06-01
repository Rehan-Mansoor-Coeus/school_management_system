<?php

namespace App;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use Notifiable, HasRoles, SoftDeletes;

    protected $guard_name = 'api';

    protected $fillable = [
        'institution_id', 'name', 'username', 'email', 'password', 'api_token',
        'phone_number', 'additional_phone_number', 'address', 'status',
        'hourly_rate', 'department_id', 'campus_id', 'locale',
    ];

    protected $hidden = [
        'password', 'remember_token', 'api_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Roles that classify a user as a non-login "person" (student/teacher/staff).
     */
    const PEOPLE_ROLES = ['student', 'teacher', 'staff'];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    /**
     * The role ids assigned to this user. Exposed so the frontend can keep using
     * `role_ids` while roles remain the single source of truth (Spatie pivot).
     */
    public function getRoleIdsAttribute()
    {
        return $this->roles->pluck('id')->map(function ($id) {
            return (int) $id;
        })->values()->all();
    }

    /**
     * Restrict a query to real login accounts (excludes student/teacher/staff people).
     */
    public function scopeLoginAccounts($query)
    {
        return $query->whereDoesntHave('roles', function ($q) {
            $q->whereIn('name', self::PEOPLE_ROLES);
        });
    }
}
