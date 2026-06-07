<?php

namespace App\Modules\Canteen\Concerns;

trait ResolvesInstitution
{
    protected function institutionId()
    {
        $user = auth()->user();
        if (! $user || ! $user->institution_id) {
            abort(422, __('canteen.no_institution'));
        }

        return (int) $user->institution_id;
    }
}
