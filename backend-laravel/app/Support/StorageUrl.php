<?php

namespace App\Support;

class StorageUrl
{
    public static function public(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (preg_match('#^https?://#i', $path)) {
            return $path;
        }

        $base = self::baseUrl();
        $normalized = ltrim(str_replace('\\', '/', $path), '/');

        return $base.'/storage/'.$normalized;
    }

    protected static function baseUrl(): string
    {
        if (! app()->runningInConsole() && app()->bound('request')) {
            $request = request();
            if ($request && $request->getSchemeAndHttpHost()) {
                return rtrim($request->getSchemeAndHttpHost(), '/');
            }
        }

        return rtrim(config('app.backend_url', config('app.url', 'http://localhost:8000')), '/');
    }
}
