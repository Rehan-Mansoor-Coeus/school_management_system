<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentFeePayment extends Model
{
    use SoftDeletes;

    protected $table = 'student_fee_payments';

    protected $fillable = [
        'institution_id', 'student_id', 'fee_id', 'reference_number', 'transaction_id',
        'payment_type', 'payment_method', 'amount', 'status', 'description',
        'receipt_number', 'paid_at', 'recorded_by', 'gateway_response',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'gateway_response' => 'array',
    ];

    public function fee()
    {
        return $this->belongsTo(Fee::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
