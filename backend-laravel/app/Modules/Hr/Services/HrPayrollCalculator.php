<?php

namespace App\Modules\Hr\Services;

class HrPayrollCalculator
{
    public function num($value)
    {
        return is_numeric($value) ? (float) $value : 0.0;
    }

    public function effectiveDays($row)
    {
        $days = $this->num(is_array($row) ? ($row['days_worked'] ?? 0) : $row->days_worked);
        $status = is_array($row) ? ($row['day_status'] ?? 'full') : $row->day_status;
        $fraction = $this->num(is_array($row) ? ($row['partial_fraction'] ?? 1) : $row->partial_fraction);

        if ($status === 'partial') {
            return $days * ($fraction > 0 ? $fraction : 1);
        }

        return $days;
    }

    public function calcItemTotals(array $payload)
    {
        $basic = $this->num($payload['basic'] ?? 0);
        $advances = $this->num($payload['advances'] ?? 0);
        $allowances = isset($payload['allowances']) && is_array($payload['allowances']) ? $payload['allowances'] : [];
        $deductions = isset($payload['deductions']) && is_array($payload['deductions']) ? $payload['deductions'] : [];

        $totalAllowances = 0;
        foreach ($allowances as $allowance) {
            $totalAllowances += $this->num(is_array($allowance) ? ($allowance['amount'] ?? 0) : $allowance->amount);
        }

        $totalDeductions = 0;
        foreach ($deductions as $deduction) {
            $totalDeductions += $this->num(is_array($deduction) ? ($deduction['amount'] ?? 0) : $deduction->amount);
        }

        $gross = $basic + $totalAllowances;
        $net = $gross - $totalDeductions - $advances;

        return [
            'basic' => round($basic, 2),
            'totalAllowances' => round($totalAllowances, 2),
            'totalDeductions' => round($totalDeductions, 2),
            'gross' => round($gross, 2),
            'net' => round($net, 2),
        ];
    }
}
