<?php

namespace App\Modules\Licensing\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;

class LicensePayment extends Model
{
    protected $fillable = [
        'institution_id', 'license_invoice_id', 'institution_semester_license_id',
        'payment_number', 'currency', 'amount', 'method', 'status', 'reference',
        'notes', 'recorded_by', 'verified_by', 'verified_at', 'paid_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'verified_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function invoice()
    {
        return $this->belongsTo(LicenseInvoice::class, 'license_invoice_id');
    }

    public function proofs()
    {
        return $this->hasMany(LicensePaymentProof::class, 'license_payment_id');
    }

    public function allocations()
    {
        return $this->hasMany(PaymentAllocation::class, 'license_payment_id');
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'institution_id' => $this->institution_id,
            'institution_name' => optional($this->institution)->name,
            'license_invoice_id' => $this->license_invoice_id,
            'invoice_number' => optional($this->invoice)->invoice_number,
            'institution_semester_license_id' => $this->institution_semester_license_id,
            'payment_number' => $this->payment_number,
            'currency' => $this->currency,
            'amount' => (float) $this->amount,
            'method' => $this->method,
            'status' => $this->status,
            'reference' => $this->reference,
            'notes' => $this->notes,
            'verified_at' => optional($this->verified_at)->toIso8601String(),
            'paid_at' => optional($this->paid_at)->toIso8601String(),
            'proofs' => $this->relationLoaded('proofs')
                ? $this->proofs->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'file_path' => $p->file_path,
                        'original_name' => $p->original_name,
                        'status' => $p->status,
                        'rejection_reason' => $p->rejection_reason,
                    ];
                })->values()->all()
                : [],
        ];
    }
}
