<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        //
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->call(function () {
            app(\App\Services\Messaging\ScheduledAnnouncementProcessor::class)->processDue();
        })->everyMinute();
        $schedule->job(new \App\Jobs\ProcessMessageQueueJob())->everyMinute();
        $schedule->call(function () {
            app(\App\Services\Fees\FeeReminderProcessor::class)->processDue();
        })->everyMinute();
        $schedule->call(function () {
            app(\App\Modules\Contracts\Services\DocumentExpiryProcessor::class)->processDue();
        })->dailyAt('07:00');
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
