<?php

namespace App\Modules\Canteen\Models;

use App\Institution;
use App\Student;
use App\User;
use Illuminate\Database\Eloquent\Model;

class CanteenOrder extends Model
{
    protected $fillable = [
        'institution_id', 'student_id', 'order_number', 'invoice_number', 'subtotal', 'subscription_credit',
        'total', 'status', 'payment_status', 'payment_method', 'served_by', 'notes', 'completed_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'subscription_credit' => 'decimal:2',
        'total' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function items()
    {
        return $this->hasMany(CanteenOrderItem::class, 'order_id');
    }

    public function payments()
    {
        return $this->hasMany(CanteenOrderPayment::class, 'order_id');
    }

    public function servedBy()
    {
        return $this->belongsTo(User::class, 'served_by');
    }
}
