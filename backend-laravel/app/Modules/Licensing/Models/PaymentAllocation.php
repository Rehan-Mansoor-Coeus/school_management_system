<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentAllocation extends Model
{
    protected $fillable = [
        'license_payment_id', 'license_invoice_id', 'institution_semester_license_id',
        'allocation_type', 'amount',
    ];

    protected $casts = [
        'amount' => 'float',
    ];
}
