<?php

namespace App\Modules\Hostel\Models;

use App\AcademicYear;
use App\Institution;
use App\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class HostelRegistration extends Model
{
    use SoftDeletes;

    protected $table = 'hostel_registrations';

    protected $fillable = [
        'institution_id', 'student_id', 'academic_year_id', 'preferred_hostel_id',
        'status', 'notes', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function preferredHostel()
    {
        return $this->belongsTo(Hostel::class, 'preferred_hostel_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(\App\User::class, 'reviewed_by');
    }

    public function allocation()
    {
        return $this->hasOne(HostelAllocation::class, 'registration_id');
    }
}
