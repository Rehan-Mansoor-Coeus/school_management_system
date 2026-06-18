<?php

namespace App\Services\Letters;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LetterAssetHelper
{
    public static function url(?string $relativePath, ?Request $request = null): ?string
    {
        if (! $relativePath) {
            return null;
        }

        $base = $request
            ? rtrim($request->getSchemeAndHttpHost(), '/')
            : rtrim(env('APP_URL', config('app.url')), '/');

        return $base.'/storage/'.ltrim(str_replace('\\', '/', $relativePath), '/');
    }

    /** DomPDF-compatible local file URI for images. */
    public static function pdfPath(?string $relativePath): ?string
    {
        if (! $relativePath) {
            return null;
        }

        $absolute = Storage::disk('public')->path($relativePath);
        if (! file_exists($absolute)) {
            return null;
        }

        $real = realpath($absolute);

        return $real ? 'file://'.str_replace('\\', '/', $real) : null;
    }

    /** Base64 data URI — most reliable for DomPDF embedded images. */
    public static function pdfDataUri(?string $relativePath): ?string
    {
        if (! $relativePath) {
            return null;
        }

        $absolute = Storage::disk('public')->path($relativePath);
        if (! file_exists($absolute)) {
            return null;
        }

        $mime = mime_content_type($absolute) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode(file_get_contents($absolute));
    }
}
