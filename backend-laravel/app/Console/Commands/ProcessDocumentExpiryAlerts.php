<?php

namespace App\Console\Commands;

use App\Modules\Contracts\Services\DocumentExpiryProcessor;
use Illuminate\Console\Command;

class ProcessDocumentExpiryAlerts extends Command
{
    protected $signature = 'documents:process-expiry-alerts';

    protected $description = 'Send expiry/renewal reminders for documents nearing their expiry date (lead times configured in license settings).';

    public function handle(DocumentExpiryProcessor $processor): int
    {
        $summary = $processor->processDue();

        $total = 0;
        foreach ($summary as $institutionId => $alerts) {
            $count = count($alerts);
            $total += $count;
            $this->info("Institution #{$institutionId}: {$count} expiry alert(s) sent.");
        }

        $this->info("Done. {$total} expiry alert(s) sent in total.");

        return 0;
    }
}
