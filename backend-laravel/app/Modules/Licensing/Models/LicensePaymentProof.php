<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class LicensePaymentProof extends Model
{
    protected $fillable = [
        'license_payment_id', 'file_path', 'original_name', 'status',
        'rejection_reason', 'uploaded_by', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];
}
