<?php

namespace App\Console\Commands;

use App\Services\InstitutionModuleService;
use Illuminate\Console\Command;

class SyncInstitutionModules extends Command
{
    protected $signature = 'institution:sync-modules {--institution= : Limit to one institution id}';

    protected $description = 'Ensure every institution has institution_modules rows for all modules';

    public function handle(InstitutionModuleService $service): int
    {
        $institutionId = $this->option('institution');

        if ($institutionId) {
            $service->syncDefaultsForInstitution((int) $institutionId);
            $this->info('Synced modules for institution #'.$institutionId);

            return 0;
        }

        $count = $service->syncDefaultsForAllInstitutions();
        $this->info('Synced modules for '.$count.' institution(s).');

        return 0;
    }
}
