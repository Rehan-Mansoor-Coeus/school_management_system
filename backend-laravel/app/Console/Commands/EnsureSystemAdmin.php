<?php

namespace App\Console\Commands;

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
        $platformRole = Role::where('name', 'system-super-admin')->where('guard_name', 'api')->first();

        if (! $platformRole) {
            $this->error('system-super-admin role not found. Run database seeders first.');

            return 1;
        }

        foreach ($emails as $email) {
            if ($email === '') {
                continue;
            }

            $user = User::withTrashed()->where('email', $email)->first();

            if (! $user) {
                $username = (stripos($email, 'okusoma') !== false || $email === 'admin@test.com')
                    ? 'admin'
                    : ('platform_' . substr(md5($email), 0, 8));

                $user = User::create([
                    'institution_id' => null,
                    'name' => 'Platform Super Admin',
                    'username' => $username,
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
                $user->institution_id = null;
                if (! $user->api_token) {
                    $user->api_token = Str::random(60);
                }
                $user->save();
                $this->info("Updated {$email} (id {$user->id}).");
            }

            if (! $user->hasRole($platformRole)) {
                $user->assignRole($platformRole);
                $this->info("Assigned system-super-admin to {$email}.");
            }
        }

        return 0;
    }
}
