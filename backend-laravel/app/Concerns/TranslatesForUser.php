<?php

namespace App\Concerns;

trait TranslatesForUser
{
    protected function userLocale($user = null): string
    {
        $user = $user ?: auth()->user();
        $locale = optional($user)->locale ?? 'en';

        return in_array($locale, ['en', 'fr'], true) ? $locale : 'en';
    }

    protected function transForUser(string $key, array $replace = [], $user = null): string
    {
        $previous = app()->getLocale();
        app()->setLocale($this->userLocale($user));
        $text = __($key, $replace);
        app()->setLocale($previous);

        return $text;
    }
}
