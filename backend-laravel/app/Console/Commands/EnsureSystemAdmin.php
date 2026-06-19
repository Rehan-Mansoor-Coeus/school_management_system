<?php

namespace App\Console\Commands;

use App\Institution;
use App\Role;
use App\Support\ProtectedSystemAccounts;
use App\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EnsureSystemAdmin extends Command
{
    protected $signature = 'system:ensure-admin
                            {--email= : Override admin email}
                            {--password= : Override admin password}
                            {--restore : Restore soft-deleted admin accounts}';

    protected $description = 'Ensure protected system admin accounts exist, are active, and can sign in.';

    public function handle(): int
    {
        $emails = $this->option('email')
            ? [trim((string) $this->option('email'))]
            : ProtectedSystemAccounts::protectedEmails();

        $password = (string) ($this->option('password') ?: ProtectedSystemAccounts::defaultPassword());
        $superAdmin = Role::where('name', 'super-admin')->where('guard_name', 'api')->first();

        if (! $superAdmin) {
            $this->error('super-admin role not found. Run database seeders first.');

            return 1;
        }

        $institution = Institution::query()->orderBy('id')->first();
        if (! $institution) {
            $this->error('No institution found.');

            return 1;
        }

        foreach ($emails as $email) {
            if ($email === '') {
                continue;
            }

            $user = User::withTrashed()->where('email', $email)->first();

            if (! $user) {
                $user = User::create([
                    'institution_id' => $institution->id,
                    'name' => 'Test Admin',
                    'email' => $email,
                    'password' => Hash::make($password),
                    'api_token' => Str::random(60),
                    'status' => 'active',
                    'locale' => 'en',
                ]);
                $this->info("Created {$email} (id {$user->id}).");
            } else {
                if ($user->trashed()) {
                    if ($this->option('restore')) {
                        $user->restore();
                        $this->info("Restored {$email}.");
                    } else {
                        $this->warn("{$email} is soft-deleted. Re-run with --restore.");

                        continue;
                    }
                }

                $user->password = Hash::make($password);
                $user->status = 'active';
                if (! $user->api_token) {
                    $user->api_token = Str::random(60);
                }
                $user->save();
                $this->info("Updated {$email} (id {$user->id}).");
            }

            if (! $user->hasRole($superAdmin)) {
                $user->assignRole($superAdmin);
                $this->info("Assigned super-admin to {$email}.");
            }
        }

        return 0;
    }
}
