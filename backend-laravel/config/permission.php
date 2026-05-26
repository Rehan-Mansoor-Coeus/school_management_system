<?php

return [
    'models' => [
        'permission' => App\Permission::class,
        'role' => App\Role::class,
    ],

    'table_names' => [
        'roles' => 'roles',
        'permissions' => 'permissions',
        'model_has_permissions' => 'model_has_permissions',
        'model_has_roles' => 'model_has_roles',
        'role_has_permissions' => 'role_has_permissions',
    ],

    'column_names' => [
        'model_morph_key' => 'model_id',
    ],

    'guard_name' => 'api',

    'cache' => [
        'expiration_time' => 1440,
        'key' => 'spatie.permission.cache',
        'store' => 'default',
    ],
];
