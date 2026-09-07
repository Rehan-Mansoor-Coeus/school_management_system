<?php

use Illuminate\Support\Facades\Route;

$rate = config('ai.chat.rate_limit', '20,1');

Route::prefix('ai')->middleware('throttle:'.$rate)->group(function () {
    Route::post('chat', 'App\Modules\AiAssistant\Controllers\AiChatController@chat');
    Route::get('suggestions', 'App\Modules\AiAssistant\Controllers\AiChatController@suggestions');
    Route::get('conversations/{id}', 'App\Modules\AiAssistant\Controllers\AiChatController@show');
    Route::post('conversations/{id}/clear', 'App\Modules\AiAssistant\Controllers\AiChatController@clear');
    Route::post('messages/{id}/feedback', 'App\Modules\AiAssistant\Controllers\AiChatController@feedback');
});

Route::middleware(['auth:api'])->prefix('ai/knowledge')->group(function () {
    Route::get('/', 'App\Modules\AiAssistant\Controllers\AiKnowledgeController@index');
    Route::post('/', 'App\Modules\AiAssistant\Controllers\AiKnowledgeController@store');
    Route::get('analytics', 'App\Modules\AiAssistant\Controllers\AiKnowledgeController@analytics');
    Route::get('{id}', 'App\Modules\AiAssistant\Controllers\AiKnowledgeController@show');
    Route::put('{id}', 'App\Modules\AiAssistant\Controllers\AiKnowledgeController@update');
    Route::put('{id}/status', 'App\Modules\AiAssistant\Controllers\AiKnowledgeController@setStatus');
});
