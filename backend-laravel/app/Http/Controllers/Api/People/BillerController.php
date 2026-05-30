<?php

namespace App\Http\Controllers\Api\People;

use App\Biller;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\People\Concerns\HandlesPeopleCrud;
use App\Http\Controllers\Api\People\Concerns\ResolvesPeopleContext;

class BillerController extends Controller
{
    use ResolvesPeopleContext, HandlesPeopleCrud;

    protected function modelClass(): string
    {
        return Biller::class;
    }

    protected function viewPermissions(): array
    {
        return ['view_billers', 'view_people_menu'];
    }

    protected function createPermissions(): array
    {
        return ['create_billers'];
    }

    protected function editPermissions(): array
    {
        return ['edit_billers'];
    }

    protected function deletePermissions(): array
    {
        return ['delete_billers'];
    }
}
