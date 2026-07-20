<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class LicenseDiscount extends Model
{
    protected $fillable = [
        'institution_id', 'institution_license_id', 'institution_semester_license_id',
        'license_invoice_id', 'discount_type', 'amount', 'currency', 'status',
        'reason', 'created_by', 'expires_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'expires_at' => 'datetime',
    ];

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'institution_id' => $this->institution_id,
            'institution_license_id' => $this->institution_license_id,
            'institution_semester_license_id' => $this->institution_semester_license_id,
            'license_invoice_id' => $this->license_invoice_id,
            'discount_type' => $this->discount_type,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'status' => $this->status,
            'reason' => $this->reason,
            'expires_at' => optional($this->expires_at)->toIso8601String(),
        ];
    }
}
