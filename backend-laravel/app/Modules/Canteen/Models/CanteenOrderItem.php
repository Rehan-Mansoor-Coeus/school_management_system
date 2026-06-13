<?php

namespace App\Modules\Canteen\Models;

use Illuminate\Database\Eloquent\Model;

class CanteenOrderItem extends Model
{
    protected $fillable = [
        'order_id', 'meal_id', 'quantity', 'unit_price', 'line_total',
        'subscription_credit', 'payment_source', 'subscription_id',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'subscription_credit' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(CanteenOrder::class, 'order_id');
    }

    public function meal()
    {
        return $this->belongsTo(CanteenMeal::class, 'meal_id');
    }

    public function subscription()
    {
        return $this->belongsTo(CanteenSubscription::class, 'subscription_id');
    }
}
