<?php

namespace App\Jobs;

use App\Announcement;
use App\Institution;
use App\Services\Messaging\AnnouncementMessagingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendAnnouncementWhatsAppJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $announcementId;

    public function __construct($announcementId)
    {
        $this->announcementId = $announcementId;
    }

    public function handle(AnnouncementMessagingService $messaging)
    {
        $announcement = Announcement::with('recipients')->find($this->announcementId);
        if (! $announcement) {
            return;
        }

        $institution = Institution::find($announcement->institution_id);
        $announcement->whatsapp_status = 'pending';
        $announcement->save();

        $messaging->dispatch($announcement, optional($institution)->name);
    }
}
