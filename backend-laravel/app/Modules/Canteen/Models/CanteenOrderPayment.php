<?php

namespace App\Modules\Canteen\Models;

use App\Institution;
use App\User;
use Illuminate\Database\Eloquent\Model;

class CanteenOrderPayment extends Model
{
    protected $fillable = [
        'order_id', 'institution_id', 'method', 'amount', 'status', 'reference',
        'gateway', 'gateway_reference', 'metadata', 'wallet_transaction_id',
        'created_by', 'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'paid_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(CanteenOrder::class, 'order_id');
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
