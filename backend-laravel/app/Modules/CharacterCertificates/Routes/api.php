<?php

use Illuminate\Support\Facades\Route;
use App\Modules\CharacterCertificates\Controllers\CharacterCertificateController;

Route::prefix('character-certificates')->group(function () {
    Route::middleware(['auth:api', 'module_enabled:character_certificates'])->group(function () {
        Route::get('reference', [CharacterCertificateController::class, 'referenceData'])
            ->middleware('permission:character_certificates.manage|character_certificates.issue');
        Route::get('my', [CharacterCertificateController::class, 'myCertificates'])
            ->middleware('permission:character_certificates.view|character_certificates.manage');
        Route::get('/', [CharacterCertificateController::class, 'index'])
            ->middleware('permission:character_certificates.manage|character_certificates.issue|character_certificates.finance_clear|character_certificates.library_clear');
        Route::post('/', [CharacterCertificateController::class, 'store'])
            ->middleware('permission:character_certificates.manage|character_certificates.issue');
        Route::get('{id}', [CharacterCertificateController::class, 'show'])
            ->middleware('permission:character_certificates.manage|character_certificates.issue|character_certificates.finance_clear|character_certificates.library_clear');
        Route::put('{id}', [CharacterCertificateController::class, 'update'])
            ->middleware('permission:character_certificates.manage|character_certificates.issue');
        Route::post('{id}/finance-clearance', [CharacterCertificateController::class, 'financeClearance'])
            ->middleware('permission:character_certificates.finance_clear|character_certificates.manage');
        Route::post('{id}/library-clearance', [CharacterCertificateController::class, 'libraryClearance'])
            ->middleware('permission:character_certificates.library_clear|character_certificates.manage');
        Route::post('{id}/issue', [CharacterCertificateController::class, 'issue'])
            ->middleware('permission:character_certificates.issue|character_certificates.manage');
        Route::get('{id}/pdf', [CharacterCertificateController::class, 'downloadPdf'])
            ->middleware('permission:character_certificates.view|character_certificates.manage|character_certificates.issue|character_certificates.finance_clear|character_certificates.library_clear');
        Route::post('{id}/void', [CharacterCertificateController::class, 'void'])
            ->middleware('permission:character_certificates.manage|character_certificates.issue');
    });
});
