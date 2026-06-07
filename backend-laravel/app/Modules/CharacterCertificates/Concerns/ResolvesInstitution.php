<?php

namespace App\Modules\CharacterCertificates\Concerns;

trait ResolvesInstitution
{
    protected function institutionId(): int
    {
        $user = auth()->user();
        if (! $user || ! $user->institution_id) {
            abort(422, __('character_certificates.no_institution'));
        }

        return (int) $user->institution_id;
    }
}
