<?php

namespace App\Modules\Licensing\Models;

use App\Institution;
use Illuminate\Database\Eloquent\Model;

class LicenseInvoice extends Model
{
    protected $fillable = [
        'institution_id', 'institution_license_id', 'institution_semester_license_id',
        'invoice_number', 'invoice_type', 'currency', 'subtotal', 'tax_amount',
        'discount_amount', 'total_amount', 'amount_paid', 'status',
        'issue_date', 'due_date', 'paid_at', 'notes', 'created_by',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'tax_amount' => 'float',
        'discount_amount' => 'float',
        'total_amount' => 'float',
        'amount_paid' => 'float',
        'issue_date' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function items()
    {
        return $this->hasMany(LicenseInvoiceItem::class, 'license_invoice_id');
    }

    public function payments()
    {
        return $this->hasMany(LicensePayment::class, 'license_invoice_id');
    }

    public function semesterLicense()
    {
        return $this->belongsTo(InstitutionSemesterLicense::class, 'institution_semester_license_id');
    }

    public function balance(): float
    {
        return max(0, (float) $this->total_amount - (float) $this->amount_paid);
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'institution_id' => $this->institution_id,
            'institution_name' => optional($this->institution)->name,
            'institution_license_id' => $this->institution_license_id,
            'institution_semester_license_id' => $this->institution_semester_license_id,
            'invoice_number' => $this->invoice_number,
            'invoice_type' => $this->invoice_type,
            'currency' => $this->currency,
            'subtotal' => (float) $this->subtotal,
            'tax_amount' => (float) $this->tax_amount,
            'discount_amount' => (float) $this->discount_amount,
            'total_amount' => (float) $this->total_amount,
            'amount_paid' => (float) $this->amount_paid,
            'balance' => $this->balance(),
            'status' => $this->status,
            'issue_date' => optional($this->issue_date)->toDateString(),
            'due_date' => optional($this->due_date)->toDateString(),
            'paid_at' => optional($this->paid_at)->toIso8601String(),
            'notes' => $this->notes,
            'items' => $this->relationLoaded('items')
                ? $this->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'item_type' => $item->item_type,
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'unit_price' => (float) $item->unit_price,
                        'line_total' => (float) $item->line_total,
                    ];
                })->values()->all()
                : [],
        ];
    }
}
