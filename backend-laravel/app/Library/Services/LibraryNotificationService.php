<?php

namespace App\Library\Services;

use App\Institution;
use App\Jobs\SendWhatsAppMessageJob;
use App\Library\LibraryNotification;
use App\Library\LibrarySetting;
use App\Services\Messaging\NotificationMessageFormatter;
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
    protected $formatter;

    public function __construct()
    {
        $this->formatter = new NotificationMessageFormatter();
    }

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

    protected function institutionName(int $institutionId): ?string
    {
        return optional(Institution::find($institutionId))->name;
    }

    protected function libraryMessage(
        int $institutionId,
        string $header,
        ?string $name,
        array $lines
    ): string {
        return $this->formatter->format(
            $header,
            $this->formatter->greeting($name),
            $lines,
            $this->institutionName($institutionId)
        );
    }

    public function requestToLibrarian(int $institutionId, string $userName, string $bookTitle, string $fromDate, string $toDate): string
    {
        return $this->libraryMessage($institutionId, 'LIBRARY REQUEST', null, [
            $this->formatter->field('Requester', $userName),
            $this->formatter->field('Book', $bookTitle),
            $this->formatter->field('Period', "{$fromDate} to {$toDate}"),
            'A new borrow request needs your review.',
        ]);
    }

    public function requestToUser(int $institutionId, string $name, string $bookTitle): string
    {
        return $this->libraryMessage($institutionId, 'LIBRARY REQUEST SUBMITTED', $name, [
            $this->formatter->field('Book', $bookTitle),
            'Your borrow request has been submitted and is awaiting approval.',
        ]);
    }

    public function approvedToUser(int $institutionId, string $name, string $bookTitle): string
    {
        return $this->libraryMessage($institutionId, 'LIBRARY REQUEST APPROVED', $name, [
            $this->formatter->field('Book', $bookTitle),
            'Your borrow request has been approved. Please present this approval notice / QR code at the library.',
        ]);
    }

    public function rejectedToUser(int $institutionId, string $name, string $bookTitle, ?string $reason): string
    {
        $lines = [
            $this->formatter->field('Book', $bookTitle),
            'Your borrow request has been rejected.',
        ];
        if ($reason) {
            $lines[] = $this->formatter->field('Reason', $reason);
        }

        return $this->libraryMessage($institutionId, 'LIBRARY REQUEST REJECTED', $name, $lines);
    }

    public function issuedToUser(int $institutionId, string $name, string $bookTitle, string $returnDate): string
    {
        return $this->libraryMessage($institutionId, 'BOOK ISSUED', $name, [
            $this->formatter->field('Book', $bookTitle),
            $this->formatter->field('Return by', $returnDate),
            'Please return the book on time.',
        ]);
    }

    public function reminderToUser(int $institutionId, string $name, string $bookTitle, string $returnDate): string
    {
        return $this->libraryMessage($institutionId, 'RETURN REMINDER', $name, [
            $this->formatter->field('Book', $bookTitle),
            $this->formatter->field('Return by', $returnDate),
            'This is a reminder to return your borrowed book.',
        ]);
    }

    public function overdueToUser(int $institutionId, string $name, string $bookTitle, string $returnDate): string
    {
        return $this->libraryMessage($institutionId, 'BOOK OVERDUE', $name, [
            $this->formatter->field('Book', $bookTitle),
            $this->formatter->field('Was due', $returnDate),
            'Please return it to avoid or settle fines.',
        ]);
    }

    public function returnedToUser(int $institutionId, string $name, string $bookTitle): string
    {
        return $this->libraryMessage($institutionId, 'BOOK RETURNED', $name, [
            $this->formatter->field('Book', $bookTitle),
            'We have recorded the return of your book. Thank you.',
        ]);
    }
}
