<?php

namespace App\Modules\Hostel\Concerns;

trait ResolvesInstitution
{
    protected function institutionId()
    {
        $user = auth()->user();
        if (! $user || ! $user->institution_id) {
            abort(422, __('hostel.no_institution'));
        }

        return (int) $user->institution_id;
    }

    protected function studentForUser()
    {
        $user = auth()->user();
        if (! $user) {
            return null;
        }

        return \App\Student::where('user_id', $user->id)
            ->where('institution_id', $user->institution_id)
            ->first();
    }
}
