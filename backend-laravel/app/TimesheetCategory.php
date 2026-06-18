<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetCategory extends Model
{
    protected $fillable = [
        'institution_id',
        'user_id',
        'name',
        'description',
        'color_tag',
        'status',
    ];

    public function activities()
    {
        return $this->hasMany(TimesheetActivity::class, 'category_id');
    }
}
