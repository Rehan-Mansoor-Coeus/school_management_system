<?php

namespace App\Modules\Canteen\Models;

use App\Institution;
use App\Student;
use Illuminate\Database\Eloquent\Model;

class CanteenSubscription extends Model
{
    protected $fillable = [
        'institution_id', 'student_id', 'feeding_plan_id', 'wallet_id',
        'status', 'meals_remaining', 'meals_used', 'amount_paid',
        'subscribed_at', 'expires_at',
    ];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'subscribed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function feedingPlan()
    {
        return $this->belongsTo(CanteenFeedingPlan::class, 'feeding_plan_id');
    }

    public function wallet()
    {
        return $this->belongsTo(CanteenWallet::class, 'wallet_id');
    }

    public function isActive()
    {
        if ($this->status !== 'active') {
            return false;
        }
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return $this->meals_remaining > 0;
    }
}
