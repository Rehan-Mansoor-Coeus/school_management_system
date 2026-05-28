<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimesheetActivity extends Model
{
    protected $fillable = [
        'institution_id',
        'user_id',
        'category_id',
        'name',
        'code',
        'description',
        'is_active',
        'status',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(TimesheetCategory::class, 'category_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
