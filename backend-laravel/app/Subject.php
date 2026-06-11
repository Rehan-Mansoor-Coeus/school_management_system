<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id',
        'name',
        'code',
        'credit_hours',
        'default_contact_hours',
        'description',
        'is_active',
    ];

    protected $casts = [
        'credit_hours' => 'float',
        'default_contact_hours' => 'integer',
        'is_active' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function assignments()
    {
        return $this->hasMany(ProgrammeSemesterSubject::class);
    }

    public function programLinks()
    {
        return $this->hasMany(ProgramSubject::class);
    }
}
