<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class LicenseInvoiceItem extends Model
{
    protected $fillable = [
        'license_invoice_id', 'item_type', 'description', 'quantity', 'unit_price', 'line_total',
    ];

    protected $casts = [
        'unit_price' => 'float',
        'line_total' => 'float',
    ];
}
