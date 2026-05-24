<?php

use Illuminate\Http\Request;

Route::prefix('auth')->group(function () {
    Route::post('register', 'Api\AuthController@register');
    Route::post('login', 'Api\AuthController@login');

    Route::middleware('auth:api')->group(function () {
        Route::post('logout', 'Api\AuthController@logout');
        Route::get('user', 'Api\AuthController@me');
    });
});

Route::middleware('auth:api')->group(function () {
    Route::get('roles', 'Api\RoleController@index');
    Route::get('permissions', 'Api\PermissionController@index');
});

Route::middleware(['auth:api', 'role:admin'])->group(function () {
    Route::post('roles', 'Api\RoleController@store');
    Route::post('permissions', 'Api\PermissionController@store');
    Route::post('users/{user}/roles', 'Api\RoleController@assignRoles');
    Route::post('roles/{role}/permissions', 'Api\RoleController@assignPermissions');
});
