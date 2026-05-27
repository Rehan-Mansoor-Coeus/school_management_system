<?php

namespace App\Modules\Admissions\Models;

use App\Models\Institution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApplicationPayment extends Model
{
    use SoftDeletes;

    protected $table = 'payments';

    protected $fillable = [
        'institution_id', 'student_id', 'fee_id', 'reference_number', 'transaction_id',
        'payment_type', 'payment_method', 'amount', 'status', 'description',
        'receipt_number', 'paid_at', 'gateway_response'
    ];

    protected $dates = ['paid_at', 'deleted_at'];

    protected $casts = [
        'gateway_response' => 'array',
    ];

    // Relationships
    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    // Scopes
    public function scopeByReference($query, $reference)
    {
        return $query->where('reference_number', $reference);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    // Methods
    public function markAsCompleted($transactionId, $response = null)
    {
        $this->update([
            'status' => 'completed',
            'transaction_id' => $transactionId,
            'paid_at' => now(),
            'gateway_response' => $response,
        ]);
    }

    public function markAsFailed($response = null)
    {
        $this->update([
            'status' => 'failed',
            'gateway_response' => $response,
        ]);
    }
}
