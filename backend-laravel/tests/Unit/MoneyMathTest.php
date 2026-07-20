<?php

namespace Tests\Unit;

use App\Modules\Licensing\Services\MoneyMath;
use PHPUnit\Framework\TestCase;

class MoneyMathTest extends TestCase
{
    use MoneyMath;

    public function test_add_and_sub_are_decimal_safe()
    {
        $this->assertSame('0.30', $this->add('0.1', '0.2'));
        $this->assertSame('0.10', $this->sub('0.3', '0.2'));
    }

    public function test_mul_and_cmp()
    {
        $this->assertSame('2500.00', $this->mul(25, 100));
        $this->assertSame(1, $this->cmp('10.01', '10.00'));
        $this->assertSame(0, $this->cmp('10.00', '10'));
        $this->assertSame(-1, $this->cmp('9.99', '10'));
    }
}
