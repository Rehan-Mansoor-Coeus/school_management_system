<?php

namespace App\Http\Middleware;

use Closure;

class HandleCors
{
    protected function allowedOrigins(): array
    {
        $raw = env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://10.110.4.223:5173');

        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    }

    public function handle($request, Closure $next)
    {
        $requestOrigin = $request->headers->get('Origin');
        $allowed = $this->allowedOrigins();

        $allowOrigin = '*';
        if ($requestOrigin && in_array($requestOrigin, $allowed, true)) {
            $allowOrigin = $requestOrigin;
        } elseif ($requestOrigin && config('app.debug')) {
            // Local dev fallback: reflect any localhost / LAN vite origin
            if (preg_match('#^https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+)(:\d+)?$#', $requestOrigin)) {
                $allowOrigin = $requestOrigin;
            }
        }

        $headers = [
            'Access-Control-Allow-Origin' => $allowOrigin,
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN, Accept, Cache-Control, Pragma, X-Active-Institution-Id',
            'Access-Control-Max-Age' => '86400',
        ];

        if ($request->getMethod() === 'OPTIONS') {
            return response('', 204, $headers);
        }

        $response = $next($request);

        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }

        return $response;
    }
}
