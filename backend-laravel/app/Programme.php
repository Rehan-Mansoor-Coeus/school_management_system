<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Programme extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id',
        'department_id',
        'name',
        'code',
        'description',
        'duration_years',
        'level',
        'semester_count',
        'tuition_fee',
        'registration_fee',
        'application_fee',
        'accreditation_number',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function semesters()
    {
        return $this->hasMany(ProgrammeSemester::class)->orderBy('semester_number');
    }
}
