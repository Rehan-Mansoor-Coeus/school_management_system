<?php

namespace App\Http\Controllers\Api\People;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\People\Concerns\HandlesUserPeopleCrud;
use App\Http\Controllers\Api\People\Concerns\ResolvesPeopleContext;

class TeacherController extends Controller
{
    use ResolvesPeopleContext, HandlesUserPeopleCrud;

    protected function categoryRole(): string
    {
        return 'teacher';
    }

    protected function viewPermissions(): array
    {
        return ['view_students', 'view_people_menu'];
    }

    protected function createPermissions(): array
    {
        return ['create_students'];
    }

    protected function editPermissions(): array
    {
        return ['edit_students'];
    }

    protected function deletePermissions(): array
    {
        return ['delete_students'];
    }
}
