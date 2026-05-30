<?php

namespace App\Http\Controllers\Api\People;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\People\Concerns\ResolvesPeopleContext;
use App\Supplier;
use App\Http\Controllers\Api\People\Concerns\HandlesPeopleCrud;

class SupplierController extends Controller
{
    use ResolvesPeopleContext, HandlesPeopleCrud;

    protected function modelClass(): string
    {
        return Supplier::class;
    }

    protected function viewPermissions(): array
    {
        return ['view_suppliers', 'view_people_menu'];
    }

    protected function createPermissions(): array
    {
        return ['create_suppliers'];
    }

    protected function editPermissions(): array
    {
        return ['edit_suppliers'];
    }

    protected function deletePermissions(): array
    {
        return ['delete_suppliers'];
    }
}
