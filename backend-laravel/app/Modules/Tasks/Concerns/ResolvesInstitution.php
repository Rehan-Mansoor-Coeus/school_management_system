<?php

namespace App\Modules\Tasks\Concerns;

trait ResolvesInstitution
{
    protected function institutionId()
    {
        $user = auth()->user();
        if (! $user || ! $user->institution_id) {
            abort(422, 'Institution context is required.');
        }

        return (int) $user->institution_id;
    }
}
