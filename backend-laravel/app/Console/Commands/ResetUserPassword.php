<?php

namespace App\Console\Commands;

use App\Institution;
use App\Role;
use App\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ResetUserPassword extends Command
{
    protected $signature = 'user:reset-password
                            {email : User email address}
                            {password : New plain-text password}
                            {--restore : Restore the user if soft-deleted}
                            {--super-admin : Ensure super-admin role is assigned}';

    protected $description = 'Reset a user password (and optionally restore / grant super-admin).';

    public function handle(): int
    {
        $email = trim((string) $this->argument('email'));
        $password = (string) $this->argument('password');

        if ($email === '' || $password === '') {
            $this->error('Email and password are required.');

            return 1;
        }

        $user = User::withTrashed()->where('email', $email)->first();

        if (! $user) {
            if (! $this->option('super-admin')) {
                $this->error("No user found for {$email}.");

                return 1;
            }

            $institution = Institution::query()->orderBy('id')->first();
            if (! $institution) {
                $this->error('No institution exists. Create one before seeding admin.');

                return 1;
            }

            $user = User::create([
                'institution_id' => $institution->id,
                'name' => 'Test Admin',
                'email' => $email,
                'password' => Hash::make($password),
                'api_token' => Str::random(60),
                'status' => 'active',
                'locale' => 'en',
            ]);
            $this->info("Created user {$email} (id {$user->id}).");
        } else {
            if ($user->trashed()) {
                if ($this->option('restore')) {
                    $user->restore();
                    $this->info("Restored soft-deleted user {$email}.");
                } else {
                    $this->error("User {$email} is soft-deleted. Re-run with --restore.");

                    return 1;
                }
            }

            $user->password = Hash::make($password);
            $user->status = 'active';
            if (! $user->api_token) {
                $user->api_token = Str::random(60);
            }
            $user->save();
            $this->info("Password reset for {$email} (id {$user->id}).");
        }

        if ($this->option('super-admin')) {
            $role = Role::where('name', 'super-admin')->where('guard_name', 'api')->first();
            if (! $role) {
                $this->warn('super-admin role not found. Run RolePermissionSeeder first.');

                return 1;
            }
            if (! $user->hasRole($role)) {
                $user->assignRole($role);
            }
            $this->info('super-admin role assigned.');
        }

        return 0;
    }
}
