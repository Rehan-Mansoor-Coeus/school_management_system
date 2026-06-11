<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ProgramSubject extends Model
{
    protected $fillable = [
        'institution_id',
        'programme_id',
        'subject_id',
        'programme_semester_id',
        'credit_hours_override',
        'contact_hours_override',
        'is_required',
        'is_active',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_active' => 'boolean',
        'credit_hours_override' => 'float',
        'contact_hours_override' => 'integer',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function programme()
    {
        return $this->belongsTo(Programme::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function semester()
    {
        return $this->belongsTo(ProgrammeSemester::class, 'programme_semester_id');
    }
}
