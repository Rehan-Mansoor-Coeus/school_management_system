<?php

namespace App\Modules\Admissions\Models;

use App\Models\User;
use App\Models\Institution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Applicant extends Model
{
    use SoftDeletes;

    protected $table = 'applicants';

    protected $fillable = [
        'institution_id', 'user_id', 'first_name', 'last_name', 'middle_name',
        'email', 'phone', 'gender', 'date_of_birth', 'nationality', 'id_number',
        'address', 'city', 'state', 'country', 'passport_path', 'transcript_path',
        'is_international'
    ];

    protected $dates = ['date_of_birth', 'deleted_at'];

    protected $casts = [
        'is_international' => 'boolean',
    ];

    // Relationships
    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    // Scopes
    public function scopeByInstitution($query, $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }

    public function scopeInternational($query)
    {
        return $query->where('is_international', true);
    }

    public function scopeLocal($query)
    {
        return $query->where('is_international', false);
    }

    // Methods
    public function getFullNameAttribute()
    {
        return trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
    }

    public function hasActiveApplication()
    {
        return $this->applications()
            ->whereIn('status', ['submitted', 'under_review', 'approved', 'admitted'])
            ->exists();
    }
}
