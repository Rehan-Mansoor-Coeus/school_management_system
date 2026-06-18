<?php

namespace App\Services;

use App\Institution;
use App\Module;
use Illuminate\Support\Facades\DB;

class InstitutionModuleService
{
    public function syncDefaultsForInstitution(int $institutionId, bool $enabled = true): void
    {
        foreach (Module::orderBy('sort_order')->get() as $module) {
            DB::table('institution_modules')->updateOrInsert(
                ['institution_id' => $institutionId, 'module_id' => $module->id],
                ['enabled' => $enabled, 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }

    public function syncDefaultsForAllInstitutions(bool $enabled = true): int
    {
        $count = 0;
        foreach (Institution::pluck('id') as $institutionId) {
            $this->syncDefaultsForInstitution((int) $institutionId, $enabled);
            $count++;
        }

        return $count;
    }
}
