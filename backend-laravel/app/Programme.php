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
        'academic_unit_id',
        'name',
        'code',
        'description',
        'duration_years',
        'duration_value',
        'duration_unit',
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

    public function academicUnit()
    {
        return $this->belongsTo(AcademicUnit::class);
    }

    public function programSubjects()
    {
        return $this->hasMany(ProgramSubject::class);
    }

    public function semesters()
    {
        return $this->hasMany(ProgrammeSemester::class)->orderBy('semester_number');
    }

    public function levels()
    {
        return $this->hasMany(ProgrammeLevel::class)->orderBy('sort_order');
    }

    public function requiredDocuments()
    {
        return $this->hasMany(ProgrammeRequiredDocument::class)->orderBy('sort_order');
    }

    public function admissionAgreement()
    {
        return $this->hasOne(AdmissionAgreement::class, 'programme_id');
    }
}
