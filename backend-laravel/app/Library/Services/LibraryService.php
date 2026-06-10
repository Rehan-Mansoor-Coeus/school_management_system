<?php

namespace App\Library\Services;

use App\Library\LibraryBook;
use App\Library\LibraryBookCopy;
use App\Library\LibraryBorrowRequest;
use App\Library\LibraryFine;
use App\Library\LibrarySetting;
use Carbon\Carbon;

class LibraryService
{
    /** Statuses that occupy a copy for a given period. */
    const ACTIVE_REQUEST_STATUSES = ['approved', 'issued'];

    public function settingsFor(int $institutionId): LibrarySetting
    {
        return LibrarySetting::firstOrCreate(
            ['institution_id' => $institutionId],
            LibrarySetting::defaults($institutionId)
        );
    }

    /**
     * Summarise availability for a book.
     */
    public function availabilityForBook(LibraryBook $book): array
    {
        $copies = $book->relationLoaded('copies') ? $book->copies : $book->copies()->get();

        $total = $copies->count();
        $usable = $copies->filter(function (LibraryBookCopy $c) {
            return ! in_array($c->status, [LibraryBookCopy::STATUS_LOST, LibraryBookCopy::STATUS_DAMAGED], true)
                && ! in_array($c->condition, ['lost', 'damaged'], true);
        });

        $available = $usable->where('status', LibraryBookCopy::STATUS_AVAILABLE)->count();
        $borrowed = $copies->whereIn('status', [LibraryBookCopy::STATUS_BORROWED, LibraryBookCopy::STATUS_OVERDUE])->count();

        return [
            'total_copies' => $total,
            'available_copies' => $available,
            'borrowed_copies' => $borrowed,
            'is_available' => $available > 0,
            'next_available_date' => $available > 0 ? null : $this->nextAvailableDate($book),
        ];
    }

    /**
     * The earliest date the book is expected to become available again,
     * considering active reservations/issued loans across all usable copies.
     */
    public function nextAvailableDate(LibraryBook $book): ?string
    {
        $copies = $book->copies()
            ->whereNotIn('status', [LibraryBookCopy::STATUS_LOST, LibraryBookCopy::STATUS_DAMAGED])
            ->get();

        if ($copies->isEmpty()) {
            return null;
        }

        $perCopyFreeDate = [];
        foreach ($copies as $copy) {
            if ($copy->status === LibraryBookCopy::STATUS_AVAILABLE) {
                return null; // a usable copy is free right now
            }

            $latestReturn = LibraryBorrowRequest::where('book_copy_id', $copy->id)
                ->whereIn('status', self::ACTIVE_REQUEST_STATUSES)
                ->max('expected_return_date');

            if ($latestReturn) {
                $perCopyFreeDate[] = Carbon::parse($latestReturn)->addDay()->toDateString();
            } elseif ($copy->expected_available_date) {
                $perCopyFreeDate[] = Carbon::parse($copy->expected_available_date)->toDateString();
            }
        }

        if (empty($perCopyFreeDate)) {
            return null;
        }

        sort($perCopyFreeDate);

        return $perCopyFreeDate[0];
    }

    /**
     * Whether a specific copy is free for the given period (no overlapping
     * approved/issued requests). Optionally exclude one request id.
     */
    public function copyIsFreeForPeriod(int $copyId, ?string $from, ?string $to, ?int $excludeRequestId = null): bool
    {
        $from = $from ? Carbon::parse($from) : Carbon::now();
        $to = $to ? Carbon::parse($to) : $from->copy()->addDays(14);

        $query = LibraryBorrowRequest::where('book_copy_id', $copyId)
            ->whereIn('status', self::ACTIVE_REQUEST_STATUSES);

        if ($excludeRequestId) {
            $query->where('id', '!=', $excludeRequestId);
        }

        $overlap = $query->get()->first(function (LibraryBorrowRequest $req) use ($from, $to) {
            $reqFrom = $req->requested_from_datetime ? Carbon::parse($req->requested_from_datetime) : Carbon::parse($req->requested_at ?? now());
            $reqTo = $req->expected_return_date
                ? Carbon::parse($req->expected_return_date)->endOfDay()
                : ($req->requested_to_datetime ? Carbon::parse($req->requested_to_datetime) : $reqFrom->copy()->addDays(14));

            return $reqFrom->lte($to) && $reqTo->gte($from);
        });

        return $overlap === null;
    }

    /**
     * Find a usable copy of the book that is free for the requested period.
     */
    public function findAvailableCopyForPeriod(LibraryBook $book, ?string $from, ?string $to, ?int $excludeRequestId = null): ?LibraryBookCopy
    {
        $copies = $book->copies()
            ->whereNotIn('status', [LibraryBookCopy::STATUS_LOST, LibraryBookCopy::STATUS_DAMAGED])
            ->whereNotIn('condition', ['lost', 'damaged'])
            ->get();

        foreach ($copies as $copy) {
            if ($this->copyIsFreeForPeriod($copy->id, $from, $to, $excludeRequestId)) {
                return $copy;
            }
        }

        return null;
    }

    /**
     * Calculate the fine for an overdue return.
     *
     * @return array{overdue_days:int, amount:float}
     */
    public function calculateFine(LibrarySetting $settings, $dueDate, $returnedAt = null): array
    {
        if (! $dueDate) {
            return ['overdue_days' => 0, 'amount' => 0.0];
        }

        $due = Carbon::parse($dueDate)->endOfDay()->addDays((int) $settings->grace_period_days);
        $returned = $returnedAt ? Carbon::parse($returnedAt) : Carbon::now();

        if ($returned->lte($due)) {
            return ['overdue_days' => 0, 'amount' => 0.0];
        }

        $overdueDays = $due->diffInDays($returned);
        $amount = round($overdueDays * (float) $settings->fine_per_day, 2);

        return ['overdue_days' => $overdueDays, 'amount' => $amount];
    }

    /**
     * Number of currently active borrows (issued, not returned) for a user.
     */
    public function activeBorrowCount(int $institutionId, int $userId): int
    {
        return LibraryBorrowRequest::where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->whereIn('status', [LibraryBorrowRequest::STATUS_ISSUED])
            ->count();
    }

    public function unpaidFineTotal(int $institutionId, int $userId): float
    {
        return (float) LibraryFine::where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->where('status', LibraryFine::STATUS_UNPAID)
            ->sum('fine_amount');
    }

    public function averageRating(int $bookId): ?float
    {
        $avg = \App\Library\LibraryBookReview::where('book_id', $bookId)->whereNotNull('rating')->avg('rating');

        return $avg !== null ? round((float) $avg, 1) : null;
    }
}
