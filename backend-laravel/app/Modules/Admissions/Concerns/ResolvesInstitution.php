<?php

namespace App\Modules\Admissions\Concerns;

trait ResolvesInstitution
{
    protected function institutionId()
    {
        $user = auth()->user();
        if (! $user || ! $user->institution_id) {
            abort(422, 'No institution assigned to current user.');
        }

        return (int) $user->institution_id;
    }
}
