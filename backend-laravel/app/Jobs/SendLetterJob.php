<?php

namespace App\Jobs;

use App\Services\Letters\LetterMessagingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendLetterJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    protected $queueId;

    public function __construct($queueId)
    {
        $this->queueId = $queueId;
    }

    public function handle(LetterMessagingService $messaging)
    {
        $result = $messaging->deliverQueuedRecipient($this->queueId);
        if (! ($result['success'] ?? false)) {
            throw new \RuntimeException($result['error'] ?? 'Letter delivery failed.');
        }
    }
}
