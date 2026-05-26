<?php

namespace App;

use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    protected $guard_name = 'api';
    protected $fillable = ['name', 'guard_name'];
}
