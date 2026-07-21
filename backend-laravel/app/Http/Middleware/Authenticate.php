<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        // API clients must receive JSON 401, never a redirect to a missing web "login" route.
        if ($request->is('api/*') || $request->expectsJson() || $request->bearerToken()) {
            return null;
        }

        return null;
    }
}
