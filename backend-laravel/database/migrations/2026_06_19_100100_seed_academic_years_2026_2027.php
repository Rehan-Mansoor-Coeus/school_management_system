<?php

use App\AcademicYear;
use App\Institution;
use Illuminate\Database\Migrations\Migration;

class SeedAcademicYears20262027 extends Migration
{
    public function up()
    {
        if (! class_exists(AcademicYear::class) || ! class_exists(Institution::class)) {
            return;
        }

        foreach (Institution::query()->get() as $institution) {
            AcademicYear::firstOrCreate(
                [
                    'institution_id' => $institution->id,
                    'code' => 'AY2026-2027-'.$institution->id,
                ],
                [
                    'name' => '2026/2027',
                    'start_year' => 2026,
                    'end_year' => 2027,
                    'start_date' => '2026-09-01',
                    'end_date' => '2027-08-31',
                    'is_active' => true,
                    'is_current' => ! AcademicYear::where('institution_id', $institution->id)->where('is_current', true)->exists(),
                ]
            );
        }
    }

    public function down()
    {
        // Non-destructive: keep academic years on rollback.
    }
}
