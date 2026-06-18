<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use SoftDeletes;

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $fillable = [
        'institution_id',
        'academic_unit_id',
        'name',
        'code',
        'description',
        'hod_id',
        'phone',
        'email',
        'office_location',
        'is_active',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function academicUnit()
    {
        return $this->belongsTo(AcademicUnit::class);
    }

    public function programmes()
    {
        return $this->hasMany(Programme::class);
    }

    public function hod()
    {
        return $this->belongsTo(User::class, 'hod_id');
    }
}
