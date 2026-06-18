<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class SqlDialect
{
    public static function isPgsql(): bool
    {
        return DB::getDriverName() === 'pgsql';
    }

    public static function yearMonth(string $column): string
    {
        return self::isPgsql()
            ? "TO_CHAR({$column}, 'YYYY-MM')"
            : "DATE_FORMAT({$column}, '%Y-%m')";
    }

    public static function minuteDiff(string $start, string $end): string
    {
        return self::isPgsql()
            ? "EXTRACT(EPOCH FROM ({$end} - {$start})) / 60"
            : "TIMESTAMPDIFF(MINUTE, {$start}, {$end})";
    }
}
