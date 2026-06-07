<?php

namespace App\Modules\Canteen\Models;

use App\Institution;
use App\Student;
use App\User;
use Illuminate\Database\Eloquent\Model;

class CanteenMealAttendance extends Model
{
    protected $table = 'canteen_meal_attendance';

    protected $fillable = [
        'institution_id', 'student_id', 'meal_id', 'subscription_id',
        'wallet_transaction_id', 'served_at', 'verification_method',
        'verified_by', 'amount_charged', 'payment_source', 'status', 'notes',
    ];

    protected $casts = [
        'served_at' => 'datetime',
        'amount_charged' => 'decimal:2',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function meal()
    {
        return $this->belongsTo(CanteenMeal::class, 'meal_id');
    }

    public function subscription()
    {
        return $this->belongsTo(CanteenSubscription::class, 'subscription_id');
    }

    public function walletTransaction()
    {
        return $this->belongsTo(CanteenWalletTransaction::class, 'wallet_transaction_id');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
