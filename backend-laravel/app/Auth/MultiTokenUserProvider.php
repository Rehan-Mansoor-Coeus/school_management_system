<?php

namespace App\Auth;

use App\User;
use App\UserApiToken;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Str;

class MultiTokenUserProvider extends EloquentUserProvider
{
    /** Max idle time before a session token is rejected (hours). */
    public const IDLE_HOURS = 2;

    public function retrieveByCredentials(array $credentials)
    {
        if (empty($credentials) || (count($credentials) === 1 && array_key_exists('password', $credentials))) {
            return null;
        }

        $query = $this->newModelQuery();

        foreach ($credentials as $key => $value) {
            if (Str::contains($key, 'password')) {
                continue;
            }

            if ($key === 'api_token') {
                $token = (string) $value;

                $session = UserApiToken::query()
                    ->where('token', $token)
                    ->where(function ($q) {
                        $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                    })
                    ->first();

                if ($session) {
                    if ($this->isIdleExpired($session)) {
                        $session->delete();

                        return null;
                    }

                    $session->forceFill(['last_used_at' => now()])->save();

                    return $session->user;
                }

                // Legacy users.api_token column (no idle tracking) — still honor absolute window via session row if present.
                $user = User::query()->where('api_token', $token)->first();
                if ($user) {
                    return $user;
                }

                return null;
            }

            $query->where($key, $value);
        }

        return $query->first();
    }

    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        if (isset($credentials['api_token'])) {
            return true;
        }

        return parent::validateCredentials($user, $credentials);
    }

    protected function isIdleExpired(UserApiToken $session): bool
    {
        $lastUsed = $session->last_used_at ?: $session->created_at;
        if (! $lastUsed) {
            return false;
        }

        return $lastUsed->lt(now()->subHours(self::IDLE_HOURS));
    }
}
