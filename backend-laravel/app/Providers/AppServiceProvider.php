<?php

namespace App\Providers;

use App\Contracts\Messaging\WhatsAppMessagingProvider;
use App\Services\Messaging\WasenderWhatsAppService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bind(WhatsAppMessagingProvider::class, WasenderWhatsAppService::class);
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
