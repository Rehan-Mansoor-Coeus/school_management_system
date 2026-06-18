<?php

namespace App\Services\Fees;

use App\Fee;
use App\FeeReminder;
use App\Http\Controllers\Api\Letters\AnnouncementRecipientSearchController;
use App\Services\Fees\FeeStatusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class FeeReminderProcessor
{
    public function processDue(): int
    {
        if (! Schema::hasTable('fee_reminders')) {
            return 0;
        }

        $count = 0;
        $due = FeeReminder::where('status', 'scheduled')
            ->where('scheduled_at', '<=', now())
            ->get();

        foreach ($due as $reminder) {
            try {
                $this->sendReminder($reminder);
                $count++;
            } catch (\Throwable $e) {
                Log::warning('Fee reminder failed: '.$e->getMessage());
            }
        }

        $this->autoCreateDueAndOverdueReminders();

        return $count;
    }

    protected function autoCreateDueAndOverdueReminders(): void
    {
        if (! Schema::hasTable('fees')) {
            return;
        }

        $statusService = new FeeStatusService();
        $fees = Fee::with('student.user')->where('balance', '>', 0)->get();

        foreach ($fees as $fee) {
            $status = $statusService->calculate($fee);
            if (! in_array($status, ['due', 'overdue'], true) || ! $fee->student || ! $fee->student->user) {
                continue;
            }

            $exists = FeeReminder::where('institution_id', $fee->institution_id)
                ->where('reminder_type', $status === 'overdue' ? 'overdue' : 'due_date')
                ->whereDate('created_at', now()->toDateString())
                ->where('filters->fee_id', $fee->id)
                ->exists();

            if ($exists) {
                continue;
            }

            FeeReminder::create([
                'institution_id' => $fee->institution_id,
                'title' => ucfirst($status).' tuition reminder',
                'message' => "Your semester fee balance of {$fee->balance} is {$status}. Please pay before {$fee->latest_payment_date}.",
                'reminder_type' => $status === 'overdue' ? 'overdue' : 'due_date',
                'status' => 'scheduled',
                'scheduled_at' => now(),
                'filters' => ['fee_id' => $fee->id, 'student_id' => $fee->student_id, 'payment_status' => $status],
            ]);
        }
    }

    protected function sendReminder(FeeReminder $reminder): void
    {
        $reminder->status = 'sending';
        $reminder->save();

        // Reuse announcement pipeline for queued WhatsApp delivery with 6-second spacing.
        $filters = $reminder->filters ?: [];
        $search = app(AnnouncementRecipientSearchController::class);
        $request = Request::create('/api/letters/recipients/search', 'GET', array_merge([
            'category' => 'students_payment_status',
            'payment_status' => $filters['payment_status'] ?? 'due',
            'all' => true,
        ], $filters));

        $recipients = $search->search($request)->getData(true);
        $reminder->recipient_count = is_array($recipients) ? count($recipients) : 0;

        $reminder->status = 'sent';
        $reminder->sent_at = now();
        $reminder->save();
    }
}
