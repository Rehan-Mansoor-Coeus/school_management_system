<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'user_id', 'applicant_id', 'programme_id',
        'registration_number', 'status', 'admission_date', 'graduation_date',
        'current_level', 'cumulative_gpa', 'sponsor_name', 'sponsor_phone',
        'sponsor_email', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'admission_date' => 'date',
        'graduation_date' => 'date',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function programme()
    {
        return $this->belongsTo(Programme::class);
    }

    public function courseRegistrations()
    {
        return $this->hasMany(CourseRegistration::class);
    }
}
