<?php

namespace App\Modules\Canteen\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CanteenMeal extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'name', 'name_fr', 'code', 'meal_type',
        'price', 'description', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function feedingPlans()
    {
        return $this->belongsToMany(CanteenFeedingPlan::class, 'canteen_feeding_plan_meals', 'meal_id', 'feeding_plan_id')
            ->withPivot('allowance')
            ->withTimestamps();
    }
}
