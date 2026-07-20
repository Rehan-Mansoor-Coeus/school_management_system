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
        'monthly_price',
        'quarterly_price',
        'six_month_price',
        'yearly_price',
        'one_time_price',
        'setup_fee',
        'is_free',
        'is_mandatory',
        'can_purchase_separately',
        'minimum_plan_id',
        'trial_available',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_free' => 'boolean',
        'is_mandatory' => 'boolean',
        'can_purchase_separately' => 'boolean',
        'trial_available' => 'boolean',
    ];

    public function institutions()
    {
        return $this->belongsToMany(Institution::class, 'institution_modules')
            ->withPivot('enabled')
            ->withTimestamps();
    }
}
