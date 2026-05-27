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
    Route::middleware(['module_enabled:users', 'permission:users.view'])->get('users', 'Api\UserController@index');
    Route::middleware(['module_enabled:roles', 'permission:roles.view'])->get('roles', 'Api\RoleController@index');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.view'])->get('permissions', 'Api\PermissionController@index');

    Route::middleware(['module_enabled:users', 'permission:users.create'])->post('users', 'Api\UserController@store');
    Route::middleware(['module_enabled:users', 'permission:users.edit'])->put('users/{user}', 'Api\UserController@update');
    Route::middleware(['module_enabled:users', 'permission:users.delete'])->delete('users/{user}', 'Api\UserController@destroy');
    Route::middleware(['module_enabled:users', 'permission:users.edit'])->post('users/{user}/roles', 'Api\UserController@assignRoles');

    Route::middleware(['module_enabled:roles', 'permission:roles.create'])->post('roles', 'Api\RoleController@store');
    Route::middleware(['module_enabled:roles', 'permission:roles.edit'])->put('roles/{role}', 'Api\RoleController@update');
    Route::middleware(['module_enabled:roles', 'permission:roles.delete'])->delete('roles/{role}', 'Api\RoleController@destroy');
    Route::middleware(['module_enabled:roles', 'permission:roles.edit'])->post('roles/{role}/permissions', 'Api\RoleController@assignPermissions');

    Route::middleware(['module_enabled:permissions', 'permission:permissions.create'])->post('permissions', 'Api\PermissionController@store');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.edit'])->put('permissions/{permission}', 'Api\PermissionController@update');
    Route::middleware(['module_enabled:permissions', 'permission:permissions.delete'])->delete('permissions/{permission}', 'Api\PermissionController@destroy');

    Route::middleware(['module_enabled:institutions', 'permission:institutions.view'])->get('institutions', 'Api\InstitutionController@index');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.create'])->post('institutions', 'Api\InstitutionController@store');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.view'])->get('institutions/{id}', 'Api\InstitutionController@show');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->put('institutions/{id}', 'Api\InstitutionController@update');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.delete'])->delete('institutions/{id}', 'Api\InstitutionController@destroy');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.settings'])->get('institutions/{id}/settings', 'Api\InstitutionController@getSettings');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.settings'])->put('institutions/{id}/settings', 'Api\InstitutionController@updateSettings');

    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->post('institutions/{id}/upload-logo', 'Api\InstitutionController@uploadLogo');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->post('institutions/{id}/upload-letterhead', 'Api\InstitutionController@uploadLetterhead');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->post('institutions/{id}/upload-signature', 'Api\InstitutionController@uploadSignature');
    Route::middleware(['module_enabled:institutions', 'permission:institutions.edit'])->post('institutions/{id}/upload-stamp', 'Api\InstitutionController@uploadStamp');
    Route::middleware('permission:modules.view')->get('modules', 'Api\ModuleController@index');
    Route::middleware('permission:modules.manage')->get('institutions/{institution}/modules', 'Api\InstitutionModuleController@show');
    Route::middleware('permission:modules.manage')->put('institutions/{institution}/modules', 'Api\InstitutionModuleController@update');
});
