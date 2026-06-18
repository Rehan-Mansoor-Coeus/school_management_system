<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class ProgrammeLevel extends Model
{
    protected $fillable = [
        'programme_id',
        'level_number',
        'name',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function programme()
    {
        return $this->belongsTo(Programme::class);
    }

    public function semesters()
    {
        return $this->hasMany(ProgrammeSemester::class)->orderBy('semester_number');
    }
}
