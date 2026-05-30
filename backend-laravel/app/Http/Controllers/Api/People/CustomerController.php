<?php

namespace App\Http\Controllers\Api\People;

use App\Customer;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\People\Concerns\HandlesPeopleCrud;
use App\Http\Controllers\Api\People\Concerns\ResolvesPeopleContext;

class CustomerController extends Controller
{
    use ResolvesPeopleContext, HandlesPeopleCrud;

    protected function modelClass(): string
    {
        return Customer::class;
    }

    protected function viewPermissions(): array
    {
        return ['view_customers', 'view_people_menu'];
    }

    protected function createPermissions(): array
    {
        return ['create_customers'];
    }

    protected function editPermissions(): array
    {
        return ['edit_customers'];
    }

    protected function deletePermissions(): array
    {
        return ['delete_customers'];
    }
}
