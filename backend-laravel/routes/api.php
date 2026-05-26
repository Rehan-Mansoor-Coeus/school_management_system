<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', 'Api\AuthController@register');
    Route::post('login', 'Api\AuthController@login');

    Route::middleware('auth:api')->group(function () {
        Route::post('logout', 'Api\AuthController@logout');
        Route::get('user', 'Api\AuthController@me');
    });
});

Route::middleware('auth:api')->group(function () {
    Route::get('users', 'Api\UserController@index');
    Route::get('roles', 'Api\RoleController@index');
    Route::get('permissions', 'Api\PermissionController@index');

    Route::middleware('role:admin')->group(function () {
        Route::post('users', 'Api\UserController@store');
        Route::put('users/{user}', 'Api\UserController@update');
        Route::delete('users/{user}', 'Api\UserController@destroy');
        Route::post('users/{user}/roles', 'Api\UserController@assignRoles');
    });

    Route::middleware('role:super-admin')->group(function () {
        Route::post('roles', 'Api\RoleController@store');
        Route::put('roles/{role}', 'Api\RoleController@update');
        Route::delete('roles/{role}', 'Api\RoleController@destroy');
        Route::post('roles/{role}/permissions', 'Api\RoleController@assignPermissions');

        Route::post('permissions', 'Api\PermissionController@store');
        Route::put('permissions/{permission}', 'Api\PermissionController@update');
        Route::delete('permissions/{permission}', 'Api\PermissionController@destroy');
    });
});
