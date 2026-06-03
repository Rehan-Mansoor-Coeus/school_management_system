<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseRegistration extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'student_id', 'course_id', 'subject_id', 'semester_id',
        'programme_semester_id', 'status', 'approved_by_hod', 'approved_by',
        'approved_at', 'rejection_reason',
    ];

    protected $casts = [
        'approved_by_hod' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function programmeSemester()
    {
        return $this->belongsTo(ProgrammeSemester::class);
    }
}
