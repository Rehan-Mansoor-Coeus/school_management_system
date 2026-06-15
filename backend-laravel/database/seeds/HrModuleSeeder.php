<?php

use App\Institution;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HrModuleSeeder extends Seeder
{
    public function run()
    {
        $institutions = Institution::all(['id']);

        foreach ($institutions as $institution) {
            DB::table('hr_institution_settings')->updateOrInsert(
                ['institution_id' => $institution->id],
                [
                    'default_currency' => 'UGX',
                    'supported_currencies' => json_encode(['UGX', 'USD', 'EUR']),
                    'staff_code_prefix' => 'HR',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $this->seedCategories($institution->id);
            $this->seedAllowances($institution->id);
            $this->seedDeductions($institution->id);
        }
    }

    protected function seedCategories($institutionId)
    {
        $items = [
            ['code' => 'PERMANENT', 'name' => 'Permanent Staff', 'description' => 'Long term employees'],
            ['code' => 'CONTRACT', 'name' => 'Contract Staff', 'description' => 'Contractual workers'],
            ['code' => 'DAILY', 'name' => 'Daily Workers', 'description' => 'Paid by day'],
        ];

        foreach ($items as $item) {
            DB::table('hr_staff_categories')->updateOrInsert(
                ['institution_id' => $institutionId, 'code' => $item['code']],
                [
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'is_active' => 1,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    protected function seedAllowances($institutionId)
    {
        $items = [
            ['code' => 'TRANSPORT', 'name' => 'Transport', 'default_amount' => 0],
            ['code' => 'HOUSING', 'name' => 'Housing', 'default_amount' => 0],
            ['code' => 'MEAL', 'name' => 'Meal', 'default_amount' => 0],
        ];

        foreach ($items as $item) {
            DB::table('hr_allowance_types')->updateOrInsert(
                ['institution_id' => $institutionId, 'code' => $item['code']],
                [
                    'name' => $item['name'],
                    'default_amount' => $item['default_amount'],
                    'is_active' => 1,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    protected function seedDeductions($institutionId)
    {
        $items = [
            ['code' => 'TAX', 'name' => 'Tax', 'default_amount' => 0],
            ['code' => 'NSSF', 'name' => 'NSSF', 'default_amount' => 0],
            ['code' => 'LOAN', 'name' => 'Loan Recovery', 'default_amount' => 0],
        ];

        foreach ($items as $item) {
            DB::table('hr_deduction_types')->updateOrInsert(
                ['institution_id' => $institutionId, 'code' => $item['code']],
                [
                    'name' => $item['name'],
                    'default_amount' => $item['default_amount'],
                    'is_active' => 1,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
