<?php

namespace App\Modules\Canteen\Models;

use App\AcademicYear;
use App\Institution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CanteenFeedingPlan extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'academic_year_id', 'name', 'name_fr', 'description',
        'total_meals', 'price', 'valid_from', 'valid_to', 'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'valid_from' => 'date',
        'valid_to' => 'date',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function meals()
    {
        return $this->belongsToMany(CanteenMeal::class, 'canteen_feeding_plan_meals', 'feeding_plan_id', 'meal_id')
            ->withPivot('allowance')
            ->withTimestamps();
    }

    public function subscriptions()
    {
        return $this->hasMany(CanteenSubscription::class, 'feeding_plan_id');
    }
}
