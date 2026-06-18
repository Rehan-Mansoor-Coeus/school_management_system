<?php

namespace App\Modules\Hr\Concerns;

trait ResolvesInstitution
{
    protected function institutionId()
    {
        $user = auth()->user();
        if (! $user || ! $user->institution_id) {
            abort(422, 'No institution associated with the authenticated user.');
        }

        return (int) $user->institution_id;
    }
}
