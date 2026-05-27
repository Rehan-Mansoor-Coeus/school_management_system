<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    protected $fillable = [
        'key',
        'name',
        'description',
        'sort_order',
        'is_active',
    ];

    public function institutions()
    {
        return $this->belongsToMany(Institution::class, 'institution_modules')
            ->withPivot('enabled')
            ->withTimestamps();
    }
}
