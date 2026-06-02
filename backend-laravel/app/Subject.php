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
        'default_contact_hours',
        'description',
        'is_active',
    ];

    protected $casts = [
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
}
