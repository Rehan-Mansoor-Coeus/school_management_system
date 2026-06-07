<?php

namespace App\Modules\Canteen\Models;

use App\Institution;
use App\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CanteenWallet extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'institution_id', 'student_id', 'wallet_number', 'balance',
        'total_credit', 'total_spent', 'is_active',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'total_credit' => 'decimal:2',
        'total_spent' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function transactions()
    {
        return $this->hasMany(CanteenWalletTransaction::class, 'wallet_id');
    }

    public function subscriptions()
    {
        return $this->hasMany(CanteenSubscription::class, 'wallet_id');
    }

    public function qrPayload()
    {
        return 'CANTEEN:'.$this->wallet_number;
    }
}
