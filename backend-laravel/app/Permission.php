<?php

namespace App;

use Spatie\Permission\Models\Permission as SpatiePermission;

class Permission extends SpatiePermission
{
    protected $guard_name = 'api';
    protected $fillable = ['name', 'guard_name'];
}
