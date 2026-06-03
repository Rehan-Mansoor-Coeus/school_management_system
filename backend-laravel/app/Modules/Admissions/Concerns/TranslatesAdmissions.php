<?php

namespace App\Modules\Admissions\Concerns;

trait TranslatesAdmissions
{
    protected function admissionsLocale($user = null): string
    {
        $user = $user ?: auth()->user();
        $locale = $user->locale ?? 'en';

        return in_array($locale, ['en', 'fr'], true) ? $locale : 'en';
    }

    protected function admissionsTrans(string $key, array $replace = [], $user = null): string
    {
        return __(
            'admissions.'.$key,
            $replace,
            $this->admissionsLocale($user)
        );
    }
}
