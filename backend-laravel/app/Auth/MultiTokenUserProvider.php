<?php

namespace App\Auth;

use App\User;
use App\UserApiToken;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Str;

class MultiTokenUserProvider extends EloquentUserProvider
{
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
                $user = User::query()->where('api_token', $token)->first();
                if ($user) {
                    return $user;
                }

                $session = UserApiToken::query()
                    ->where('token', $token)
                    ->where(function ($q) {
                        $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                    })
                    ->first();

                if ($session) {
                    $session->forceFill(['last_used_at' => now()])->save();

                    return $session->user;
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
}
