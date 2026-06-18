<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ProgrammeSemesterSubject extends Model
{
    protected $table = 'programme_semester_subjects';

    protected $fillable = [
        'programme_semester_id',
        'subject_id',
        'contact_hours',
        'is_required',
        'is_active',
    ];

    protected $casts = [
        'contact_hours' => 'integer',
        'is_required' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function semester()
    {
        return $this->belongsTo(ProgrammeSemester::class, 'programme_semester_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}
