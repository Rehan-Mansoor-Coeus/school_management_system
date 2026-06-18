<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AcademicYear extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'name', 'code', 'start_year', 'end_year',
        'start_date', 'end_date', 'is_active', 'is_current',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_current' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}
