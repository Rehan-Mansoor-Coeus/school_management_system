<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicUnit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id',
        'name',
        'unit_type',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function departments()
    {
        return $this->hasMany(Department::class);
    }

    public function programmes()
    {
        return $this->hasMany(Programme::class);
    }
}
