<?php

namespace App\Library\Services;

use App\Jobs\SendWhatsAppMessageJob;
use App\Library\LibraryNotification;
use App\Library\LibrarySetting;
use App\User;
use Illuminate\Support\Facades\Log;

/**
 * Library WhatsApp notifications.
 *
 * This service does NOT implement its own WhatsApp engine. It reuses the
 * existing SendWhatsAppMessageJob / WhatsAppService built for the Letters and
 * Announcements module, and logs delivery through the shared message_logs table
 * (module = "library") plus a library-specific audit row.
 */
class LibraryNotificationService
{
    public function notificationsEnabled(int $institutionId): bool
    {
        $settings = LibrarySetting::where('institution_id', $institutionId)->first();
        if (! $settings) {
            return true;
        }

        return (bool) $settings->whatsapp_notifications_enabled;
    }

    public function notifyUser(?User $user, int $institutionId, string $event, string $message, ?int $requestId = null): void
    {
        if (! $user) {
            return;
        }

        $phone = $this->resolvePhone($user);
        $this->dispatch($institutionId, $phone, $message, $event, $user->id, $requestId, $user->name);
    }

    public function notifyLibrarians(int $institutionId, string $event, string $message, ?int $requestId = null): void
    {
        foreach ($this->resolveLibrarians($institutionId) as $librarian) {
            $phone = $this->resolvePhone($librarian);
            $this->dispatch($institutionId, $phone, $message, $event, $librarian->id, $requestId, $librarian->name);
        }
    }

    /**
     * @return \Illuminate\Support\Collection<int, User>
     */
    public function resolveLibrarians(int $institutionId)
    {
        $query = User::query()->where('institution_id', $institutionId);

        $query->where(function ($q) {
            $q->whereHas('roles', function ($r) {
                $r->where('name', 'librarian');
            })->orWhereHas('permissions', function ($p) {
                $p->where('name', 'approve_borrow_requests');
            })->orWhereHas('roles.permissions', function ($p) {
                $p->where('name', 'approve_borrow_requests');
            });
        });

        $librarians = $query->get();

        $settings = LibrarySetting::where('institution_id', $institutionId)->first();
        $configuredIds = $settings && is_array($settings->librarian_user_ids) ? $settings->librarian_user_ids : [];
        if (! empty($configuredIds)) {
            $extra = User::whereIn('id', $configuredIds)->where('institution_id', $institutionId)->get();
            $librarians = $librarians->concat($extra);
        }

        return $librarians->unique('id')->values();
    }

    protected function resolvePhone(?User $user): ?string
    {
        if (! $user) {
            return null;
        }

        return $user->phone_number ?: $user->additional_phone_number ?: null;
    }

    protected function dispatch(int $institutionId, ?string $phone, string $message, string $event, ?int $userId, ?int $requestId, ?string $recipientName): void
    {
        if (! $this->notificationsEnabled($institutionId)) {
            return;
        }

        $log = LibraryNotification::create([
            'institution_id' => $institutionId,
            'borrow_request_id' => $requestId,
            'user_id' => $userId,
            'event' => $event,
            'channel' => 'whatsapp',
            'phone_number' => $phone,
            'message' => $message,
            'status' => $phone ? 'queued' : 'skipped',
        ]);

        if (! $phone) {
            return;
        }

        try {
            SendWhatsAppMessageJob::dispatch(
                [
                    'type' => 'text',
                    'to' => $phone,
                    'text' => $message,
                ],
                [
                    'institution_id' => $institutionId,
                    'message_type' => 'text',
                    'module' => 'library',
                    'related_id' => $requestId,
                    'recipient_name' => $recipientName,
                    'phone_number' => $phone,
                    'message' => $message,
                ]
            );
            $log->update(['status' => 'queued', 'sent_at' => now()]);
        } catch (\Throwable $e) {
            Log::warning('Library WhatsApp dispatch failed', ['error' => $e->getMessage()]);
            $log->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
        }
    }

    // ----- Message templates -------------------------------------------------

    public function requestToLibrarian(string $userName, string $bookTitle, string $fromDate, string $toDate): string
    {
        return "New library request: {$userName} requested \"{$bookTitle}\" from {$fromDate} to {$toDate}.";
    }

    public function requestToUser(string $name, string $bookTitle): string
    {
        return "Dear {$name}, your request to borrow \"{$bookTitle}\" has been submitted and is awaiting approval.";
    }

    public function approvedToUser(string $name, string $bookTitle): string
    {
        return "Dear {$name}, your request to borrow \"{$bookTitle}\" has been approved. Please present this approval notice / QR code at the library.";
    }

    public function rejectedToUser(string $name, string $bookTitle, ?string $reason): string
    {
        $msg = "Dear {$name}, your request to borrow \"{$bookTitle}\" has been rejected.";
        if ($reason) {
            $msg .= " Reason: {$reason}.";
        }

        return $msg;
    }

    public function issuedToUser(string $name, string $bookTitle, string $returnDate): string
    {
        return "Dear {$name}, you have signed out \"{$bookTitle}\". Please return it by {$returnDate}.";
    }

    public function reminderToUser(string $name, string $bookTitle, string $returnDate): string
    {
        return "Dear {$name}, this is a reminder to return \"{$bookTitle}\" by {$returnDate}.";
    }

    public function overdueToUser(string $name, string $bookTitle, string $returnDate): string
    {
        return "Dear {$name}, \"{$bookTitle}\" was due on {$returnDate}. Please return it to avoid or settle fines.";
    }

    public function returnedToUser(string $name, string $bookTitle): string
    {
        return "Dear {$name}, we have recorded the return of \"{$bookTitle}\". Thank you.";
    }
}
