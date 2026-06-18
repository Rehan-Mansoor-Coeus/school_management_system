<?php

namespace App\Modules\Timetable\Concerns;

trait ResolvesInstitution
{
    protected function institutionId(): int
    {
        return (int) (optional(auth()->user())->institution_id ?: 1);
    }
}
