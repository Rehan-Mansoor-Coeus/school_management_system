<?php

namespace App\Modules\Admissions\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApplicationPayment extends Model
{
    use SoftDeletes;

    protected $table = 'payments';

    protected $fillable = [
        'institution_id', 'student_id', 'fee_id', 'application_id',
        'reference_number', 'transaction_id', 'payment_type', 'payment_method',
        'amount', 'status', 'description', 'proof_path', 'proof_notes',
        'receipt_number', 'paid_at', 'gateway_response', 'reviewed_by', 'reviewed_at', 'review_notes',
    ];

    protected $dates = ['paid_at', 'reviewed_at', 'deleted_at'];

    protected $casts = [
        'gateway_response' => 'array',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(\App\User::class, 'reviewed_by');
    }

    public function scopePendingProof($query)
    {
        return $query->where('status', 'pending')->whereNotNull('proof_path');
    }

    public function scopeApplicationFee($query)
    {
        return $query->where('payment_type', 'application_fee');
    }

    public function scopeByReference($query, $reference)
    {
        return $query->where('reference_number', $reference);
    }

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

    public function markAsRejected($userId, $reason = null)
    {
        $this->update([
            'status' => 'failed',
            'reviewed_by' => $userId,
            'reviewed_at' => now(),
            'review_notes' => $reason,
        ]);
    }

    public function markAsApproved($userId, $notes = null)
    {
        $this->update([
            'status' => 'completed',
            'paid_at' => now(),
            'reviewed_by' => $userId,
            'reviewed_at' => now(),
            'review_notes' => $notes,
        ]);
    }
}
