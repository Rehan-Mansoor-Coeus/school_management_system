<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ProgrammeSemester extends Model
{
    protected $fillable = [
        'programme_id',
        'semester_number',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function programme()
    {
        return $this->belongsTo(Programme::class);
    }

    public function assignments()
    {
        return $this->hasMany(ProgrammeSemesterSubject::class);
    }
}
