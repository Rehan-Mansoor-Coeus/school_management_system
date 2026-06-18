<?php

namespace App\Modules\Audit\Concerns;

trait ResolvesInstitution
{
    protected function institutionId(): int
    {
        $user = auth()->user();
        if (! $user || ! $user->institution_id) {
            abort(422, 'No institution context.');
        }

        return (int) $user->institution_id;
    }
}
