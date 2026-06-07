<?php

namespace App\Modules\Canteen\Models;

use App\Institution;
use App\User;
use Illuminate\Database\Eloquent\Model;

class CanteenWalletTransaction extends Model
{
    protected $fillable = [
        'institution_id', 'wallet_id', 'type', 'amount', 'balance_after',
        'source', 'reference', 'notes', 'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function wallet()
    {
        return $this->belongsTo(CanteenWallet::class, 'wallet_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
