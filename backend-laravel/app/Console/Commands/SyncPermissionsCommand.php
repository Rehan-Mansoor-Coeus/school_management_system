<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SyncPermissionsCommand extends Command
{
    protected $signature = 'permissions:sync';

    protected $description = 'Create missing permissions from the catalog and grant all permissions to super-admin roles';

    public function handle()
    {
        $this->call('db:seed', ['--class' => 'SyncAllPermissionsSeeder', '--force' => true]);

        return 0;
    }
}
