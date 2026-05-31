<?php

namespace App\Jobs;

use App\MessageQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessMessageQueueJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle()
    {
        $items = MessageQueue::query()
            ->where('status', 'pending')
            ->where(function ($q) {
                $q->whereNull('scheduled_at')->orWhere('scheduled_at', '<=', now());
            })
            ->orderBy('id')
            ->limit(50)
            ->get();

        foreach ($items as $item) {
            if ($item->module === 'letter') {
                SendLetterJob::dispatch($item->id)->onQueue('whatsapp');
            }
        }
    }
}
