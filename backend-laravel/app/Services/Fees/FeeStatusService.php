<?php

namespace App\Services\Fees;

use App\Fee;
use Carbon\Carbon;

class FeeStatusService
{
    public function calculate(Fee $fee): string
    {
        $balance = (float) $fee->balance;
        $amountPaid = (float) $fee->amount_paid;
        $today = Carbon::today();

        if ($balance <= 0) {
            return 'paid';
        }

        if ($amountPaid > 0) {
            return 'partial';
        }

        $expected = $fee->due_date ? Carbon::parse($fee->due_date) : null;
        $latest = $fee->latest_payment_date ? Carbon::parse($fee->latest_payment_date) : null;

        if ($expected && $today->lt($expected)) {
            return 'pending';
        }

        if ($latest && $today->gt($latest)) {
            return 'overdue';
        }

        if ($expected && $today->gte($expected)) {
            return 'due';
        }

        return 'pending';
    }
}
