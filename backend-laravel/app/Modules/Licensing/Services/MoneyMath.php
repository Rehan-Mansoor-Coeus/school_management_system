<?php

namespace App\Modules\Licensing\Services;

trait MoneyMath
{
    protected function money($value): string
    {
        if (function_exists('bcadd')) {
            return bcadd((string) $value, '0', 2);
        }

        return number_format((float) $value, 2, '.', '');
    }

    protected function add($a, $b): string
    {
        return function_exists('bcadd')
            ? bcadd($this->money($a), $this->money($b), 2)
            : $this->money((float) $a + (float) $b);
    }

    protected function sub($a, $b): string
    {
        return function_exists('bcsub')
            ? bcsub($this->money($a), $this->money($b), 2)
            : $this->money((float) $a - (float) $b);
    }

    protected function mul($a, $b): string
    {
        return function_exists('bcmul')
            ? bcmul($this->money($a), $this->money($b), 2)
            : $this->money((float) $a * (float) $b);
    }

    protected function div($a, $b): string
    {
        if (function_exists('bcdiv')) {
            return bcdiv($this->money($a), $this->money($b), 6);
        }
        $divisor = (float) $b;

        return $divisor == 0.0 ? '0.00' : $this->money((float) $a / $divisor);
    }

    protected function cmp($a, $b): int
    {
        return function_exists('bccomp')
            ? bccomp($this->money($a), $this->money($b), 2)
            : ((float) $a <=> (float) $b);
    }
}
