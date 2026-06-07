<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ProgrammeSemester extends Model
{
    protected $fillable = [
        'programme_id',
        'programme_level_id',
        'semester_number',
        'name',
        'total_semester_fee',
        'expected_payment_date',
        'latest_payment_date',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'expected_payment_date' => 'date',
        'latest_payment_date' => 'date',
    ];

    public function programme()
    {
        return $this->belongsTo(Programme::class);
    }

    public function level()
    {
        return $this->belongsTo(ProgrammeLevel::class, 'programme_level_id');
    }

    public function assignments()
    {
        return $this->hasMany(ProgrammeSemesterSubject::class);
    }
}
