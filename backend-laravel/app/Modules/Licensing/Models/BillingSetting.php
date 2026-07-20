<?php

namespace App\Modules\Licensing\Models;

use Illuminate\Database\Eloquent\Model;

class BillingSetting extends Model
{
    protected $fillable = [
        'default_currency', 'invoice_prefix', 'invoice_number_format', 'receipt_prefix',
        'default_billing_cycle', 'default_grace_period_days', 'default_payment_due_days',
        'billing_email', 'billing_phone', 'bank_instructions', 'mobile_money_instructions',
        'invoice_footer', 'payment_terms', 'auto_suspend_on_overdue', 'payment_methods',
    ];

    protected $casts = [
        'auto_suspend_on_overdue' => 'boolean',
        'payment_methods' => 'array',
    ];

    public static function current(): self
    {
        $settings = static::query()->first();
        if ($settings) {
            return $settings;
        }

        return static::create([
            'default_currency' => 'XAF',
            'invoice_prefix' => 'OKU-INV',
            'invoice_number_format' => '{prefix}-{year}-{seq}',
            'receipt_prefix' => 'OKU-RCT',
            'default_billing_cycle' => 'yearly',
            'default_grace_period_days' => 7,
            'default_payment_due_days' => 14,
            'payment_methods' => ['mobile_money', 'bank_transfer', 'card', 'cash'],
        ]);
    }
}
