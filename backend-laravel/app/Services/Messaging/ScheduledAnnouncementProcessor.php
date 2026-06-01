<?php

namespace App\Services\Messaging;

use App\AnnouncementSchedule;
use App\Institution;

class ScheduledAnnouncementProcessor
{
    protected $messaging;

    public function __construct(AnnouncementMessagingService $messaging)
    {
        $this->messaging = $messaging;
    }

    public function processDue(): int
    {
        $processed = 0;

        AnnouncementSchedule::query()
            ->with(['announcement.recipients', 'announcement.attachments'])
            ->where('status', 'pending')
            ->where('scheduled_at', '<=', now())
            ->orderBy('scheduled_at')
            ->limit(30)
            ->get()
            ->each(function (AnnouncementSchedule $schedule) use (&$processed) {
                $announcement = $schedule->announcement;
                if (! $announcement || $announcement->recipients->isEmpty()) {
                    $schedule->status = 'failed';
                    $schedule->save();

                    return;
                }

                $institution = Institution::find($announcement->institution_id);
                $this->messaging->dispatch($announcement->fresh(['recipients', 'attachments']), optional($institution)->name);

                $schedule->status = 'sent';
                $schedule->sent_at = now();
                $schedule->save();

                $pendingSchedules = AnnouncementSchedule::query()
                    ->where('announcement_id', $announcement->id)
                    ->where('status', 'pending')
                    ->count();

                if ($pendingSchedules > 0) {
                    $announcement->status = 'scheduled';
                    $announcement->whatsapp_status = 'scheduled';
                    $announcement->save();
                }

                $processed++;
            });

        return $processed;
    }
}
