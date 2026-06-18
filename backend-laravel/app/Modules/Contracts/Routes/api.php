<?php

use App\Modules\Contracts\Controllers\ContractController;
use App\Modules\Contracts\Controllers\ContractDashboardController;
use App\Modules\Contracts\Controllers\ContractSigningController;
use App\Modules\Contracts\Controllers\ContractTemplateController;
use App\Modules\Contracts\Controllers\DocumentSettingController;
use App\Modules\Contracts\Controllers\DocumentTypeController;
use Illuminate\Support\Facades\Route;

Route::prefix('contracts')->group(function () {
    // Public, no-login signing + verification
    Route::get('sign/{token}', [ContractSigningController::class, 'show']);
    Route::post('sign', [ContractSigningController::class, 'sign']);
    Route::post('sign/upload', [ContractSigningController::class, 'uploadDocument']);
    Route::get('verify/{code}', [ContractSigningController::class, 'verify']);

    Route::middleware(['auth:api', 'module_enabled:document_workflow'])->group(function () {
        // View
        $view = 'permission:documents.view|documents.manage|contracts.view|contracts.manage';
        // Edit (create/generate/send/update/approve)
        $edit = 'permission:documents.edit|documents.create|documents.manage|contracts.manage';
        $generate = 'permission:documents.generate|documents.edit|documents.manage|contracts.generate|contracts.manage';
        $send = 'permission:documents.send|documents.edit|documents.manage|contracts.send|contracts.manage';
        $approve = 'permission:documents.approve|documents.manage|contracts.approve|contracts.manage';
        $reject = 'permission:documents.reject|documents.manage|contracts.reject|contracts.manage';
        $renew = 'permission:documents.renew|documents.edit|documents.manage|contracts.renew|contracts.manage';
        $download = 'permission:documents.download|documents.view|documents.manage|contracts.download|contracts.manage';
        $templates = 'permission:documents.templates.manage|documents.edit|documents.manage|contracts.templates.manage|contracts.manage';
        $typesView = 'permission:documents.types.view|documents.view|documents.manage|contracts.view|contracts.manage';
        $typesManage = 'permission:documents.types.manage|documents.edit|documents.manage|contracts.manage';
        $typesDelete = 'permission:documents.types.manage|documents.delete|documents.manage';
        $delete = 'permission:documents.delete|documents.manage|contracts.manage';
        $settingsView = 'permission:documents.settings.manage|documents.view|documents.manage|contracts.manage';
        $settingsManage = 'permission:documents.settings.manage|documents.manage|contracts.manage';

        Route::middleware($view)->get('dashboard', [ContractDashboardController::class, 'stats']);

        // Document workflow settings (expiry alert lead times / license settings)
        Route::middleware($settingsView)->get('settings', [DocumentSettingController::class, 'show']);
        Route::middleware($settingsManage)->put('settings', [DocumentSettingController::class, 'update']);

        // Document Types (configurable)
        Route::middleware($typesView)->get('document-types', [DocumentTypeController::class, 'index']);
        Route::middleware($typesView)->get('document-types/{id}', [DocumentTypeController::class, 'show']);
        Route::middleware($typesManage)->post('document-types', [DocumentTypeController::class, 'store']);
        Route::middleware($typesManage)->put('document-types/{id}', [DocumentTypeController::class, 'update']);
        Route::middleware($typesDelete)->delete('document-types/{id}', [DocumentTypeController::class, 'destroy']);

        // Templates
        Route::middleware($view)->get('templates', [ContractTemplateController::class, 'index']);
        Route::middleware($templates)->post('templates', [ContractTemplateController::class, 'store']);
        Route::middleware($view)->get('templates/{id}', [ContractTemplateController::class, 'show']);
        Route::middleware($templates)->put('templates/{id}', [ContractTemplateController::class, 'update']);
        Route::middleware($templates)->post('templates/{id}/clone', [ContractTemplateController::class, 'clone']);
        Route::middleware($templates)->post('templates/{id}/archive', [ContractTemplateController::class, 'archive']);

        // Documents (contract instances)
        Route::middleware($generate)->post('generate', [ContractController::class, 'generate']);
        Route::middleware($generate)->post('generate/bulk', [ContractController::class, 'generateBulk']);

        Route::middleware($view)->get('/', [ContractController::class, 'index']);
        Route::middleware($download)->get('{id}/download', [ContractController::class, 'download']);
        Route::middleware($send)->post('{id}/send', [ContractController::class, 'send']);
        Route::middleware($approve)->post('{id}/approve', [ContractController::class, 'approve']);
        Route::middleware($reject)->post('{id}/reject', [ContractController::class, 'reject']);
        Route::middleware($renew)->post('{id}/renew', [ContractController::class, 'renew']);
        Route::middleware($delete)->delete('{id}', [ContractController::class, 'destroy']);
        Route::middleware($view)->get('{id}', [ContractController::class, 'show']);
    });
});
