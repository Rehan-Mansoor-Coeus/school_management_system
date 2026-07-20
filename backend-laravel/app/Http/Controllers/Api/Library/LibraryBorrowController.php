<?php

namespace App\Http\Controllers\Api\Library;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Library\Concerns\ResolvesLibraryContext;
use App\Library\LibraryBook;
use App\Library\LibraryBookCopy;
use App\Library\LibraryBorrowRequest;
use App\Library\LibraryBorrowTransaction;
use App\Library\LibraryFine;
use App\Library\Services\LibraryNotificationService;
use App\Library\Services\LibraryService;
use App\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LibraryBorrowController extends Controller
{
    use ResolvesLibraryContext;

    protected function service(): LibraryService
    {
        return app(LibraryService::class);
    }

    protected function notifier(): LibraryNotificationService
    {
        return app(LibraryNotificationService::class);
    }

    // ---- Create a borrow request -------------------------------------------

    public function store(Request $request)
    {
        $this->authorizeLibrary($request, ['borrow_books']);

        $institutionId = $this->institutionId($request);
        $user = $request->user();
        $settings = $this->settings($request);

        $data = $request->validate([
            'book_id' => 'required|integer',
            'book_copy_id' => 'nullable|integer',
            'requested_from_datetime' => 'nullable|date',
            'requested_to_datetime' => 'nullable|date',
            'expected_return_date' => 'nullable|date',
        ]);

        $book = LibraryBook::where('institution_id', $institutionId)->findOrFail($data['book_id']);

        if ($book->status !== 'active') {
            return response()->json(['message' => 'This book is not available for borrowing.'], 422);
        }

        $from = $data['requested_from_datetime'] ?? Carbon::now()->toDateTimeString();
        $maxDays = (int) $settings->max_borrow_days;
        $expectedReturn = $data['expected_return_date']
            ?? Carbon::parse($from)->addDays($maxDays > 0 ? $maxDays : 14)->toDateString();
        $to = $data['requested_to_datetime'] ?? $expectedReturn;

        // Return date cannot exceed maximum borrowing duration.
        if (! $settings->allow_unlimited_borrowing && $maxDays > 0) {
            $maxReturn = Carbon::parse($from)->addDays($maxDays);
            if (Carbon::parse($expectedReturn)->gt($maxReturn)) {
                return response()->json([
                    'message' => "Return date cannot exceed the maximum borrowing duration of {$maxDays} days.",
                ], 422);
            }
        }

        // Max number of books a user can borrow at once.
        if (! $settings->allow_unlimited_borrowing) {
            $active = $this->service()->activeBorrowCount($institutionId, $user->id)
                + LibraryBorrowRequest::where('institution_id', $institutionId)
                    ->where('user_id', $user->id)
                    ->whereIn('status', [LibraryBorrowRequest::STATUS_PENDING, LibraryBorrowRequest::STATUS_APPROVED])
                    ->count();
            if ($active >= (int) $settings->max_books_per_user) {
                return response()->json([
                    'message' => "You have reached the maximum of {$settings->max_books_per_user} concurrent borrow(s)/request(s).",
                ], 422);
            }
        }

        // Block borrowing with unpaid fines if configured.
        if ($settings->block_borrow_on_unpaid_fines) {
            $unpaid = $this->service()->unpaidFineTotal($institutionId, $user->id);
            if ($unpaid > 0) {
                return response()->json([
                    'message' => 'You have unpaid library fines. Please settle them before borrowing.',
                ], 422);
            }
        }

        // Determine copy. If a specific copy was requested, validate it; else
        // find any usable copy free for the requested period.
        $copy = null;
        if (! empty($data['book_copy_id'])) {
            $copy = LibraryBookCopy::where('institution_id', $institutionId)
                ->where('book_id', $book->id)
                ->find($data['book_copy_id']);
            if ($copy && (! $copy->isBorrowable() || ! $this->service()->copyIsFreeForPeriod($copy->id, $from, $to))) {
                $copy = null;
            }
        }
        if (! $copy) {
            $copy = $this->service()->findAvailableCopyForPeriod($book, $from, $to);
        }

        $availability = $this->service()->availabilityForBook($book);
        if (! $copy && $availability['available_copies'] === 0 && empty($data['requested_from_datetime'])) {
            // No copy free now and the user did not pick a future period.
            return response()->json([
                'message' => 'No copies are currently available.',
                'next_available_date' => $availability['next_available_date'],
                'allow_reservation' => true,
            ], 422);
        }

        $autoApprove = ! $settings->require_approval;

        $borrow = DB::transaction(function () use ($institutionId, $user, $book, $copy, $from, $to, $expectedReturn, $autoApprove) {
            $borrow = LibraryBorrowRequest::create([
                'institution_id' => $institutionId,
                'user_id' => $user->id,
                'book_id' => $book->id,
                'book_copy_id' => $copy ? $copy->id : null,
                'requested_from_datetime' => $from,
                'requested_to_datetime' => $to,
                'expected_return_date' => $expectedReturn,
                'status' => $autoApprove ? LibraryBorrowRequest::STATUS_APPROVED : LibraryBorrowRequest::STATUS_PENDING,
                'token' => (string) Str::uuid(),
                'requested_at' => now(),
                'approved_at' => $autoApprove ? now() : null,
            ]);

            if ($copy && $autoApprove) {
                $copy->update([
                    'status' => LibraryBookCopy::STATUS_RESERVED,
                    'current_borrower_id' => $user->id,
                    'expected_available_date' => $expectedReturn,
                ]);
            }

            return $borrow;
        });

        // Notifications: borrower + librarians.
        $bookTitle = $book->title;
        $fromLabel = Carbon::parse($from)->toDayDateTimeString();
        $toLabel = Carbon::parse($expectedReturn)->toFormattedDateString();

        $this->notifier()->notifyUser($user, $institutionId, 'requested', $this->notifier()->requestToUser($institutionId, $user->name, $bookTitle), $borrow->id);
        $this->notifier()->notifyLibrarians($institutionId, 'requested', $this->notifier()->requestToLibrarian($institutionId, $user->name, $bookTitle, $fromLabel, $toLabel), $borrow->id);

        return response()->json($this->transform($borrow->fresh(['book', 'copy', 'user'])), 201);
    }

    // ---- Listing & detail ---------------------------------------------------

    public function index(Request $request)
    {
        $this->authorizeLibrary($request, ['view_own_borrow_requests', 'approve_borrow_requests', 'view_borrowed_books', 'view_library_menu']);

        $query = $this->scopedQuery($request);

        if ($status = $request->get('status')) {
            $query->whereIn('status', array_map('trim', explode(',', $status)));
        }

        return response()->json($this->collection($query->orderByDesc('requested_at')->get()));
    }

    public function show(Request $request, $id)
    {
        $borrow = LibraryBorrowRequest::with(['book', 'copy', 'user'])
            ->where('institution_id', $this->institutionId($request))
            ->findOrFail($id);

        $this->ensureCanSee($request, $borrow);

        return response()->json($this->transform($borrow));
    }

    // ---- Approve / Reject ---------------------------------------------------

    public function approve(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['approve_borrow_requests']);

        $institutionId = $this->institutionId($request);
        $borrow = LibraryBorrowRequest::where('institution_id', $institutionId)->findOrFail($id);

        if ($borrow->status !== LibraryBorrowRequest::STATUS_PENDING) {
            return response()->json(['message' => 'Only pending requests can be approved.'], 422);
        }

        $book = LibraryBook::findOrFail($borrow->book_id);
        $from = $borrow->requested_from_datetime ?: now();
        $to = $borrow->expected_return_date ?: $borrow->requested_to_datetime;

        $copy = null;
        if ($borrow->book_copy_id) {
            $copy = LibraryBookCopy::find($borrow->book_copy_id);
            if ($copy && ! $this->service()->copyIsFreeForPeriod($copy->id, $from, $to, $borrow->id)) {
                $copy = null;
            }
        }
        if (! $copy) {
            $copy = $this->service()->findAvailableCopyForPeriod($book, $from, $to, $borrow->id);
        }
        if (! $copy) {
            return response()->json([
                'message' => 'No copy is available for the requested period.',
                'next_available_date' => $this->service()->nextAvailableDate($book),
            ], 422);
        }

        DB::transaction(function () use ($borrow, $copy, $request) {
            $borrow->update([
                'status' => LibraryBorrowRequest::STATUS_APPROVED,
                'book_copy_id' => $copy->id,
                'approved_by' => optional($request->user())->id,
                'approved_at' => now(),
                'token' => $borrow->token ?: (string) Str::uuid(),
            ]);
            $copy->update([
                'status' => LibraryBookCopy::STATUS_RESERVED,
                'current_borrower_id' => $borrow->user_id,
                'expected_available_date' => $borrow->expected_return_date,
            ]);
        });

        $user = User::find($borrow->user_id);
        $this->notifier()->notifyUser($user, $institutionId, 'approved', $this->notifier()->approvedToUser($institutionId, optional($user)->name ?? '', $book->title), $borrow->id);

        return response()->json($this->transform($borrow->fresh(['book', 'copy', 'user'])));
    }

    public function reject(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['reject_borrow_requests']);

        $institutionId = $this->institutionId($request);
        $borrow = LibraryBorrowRequest::where('institution_id', $institutionId)->findOrFail($id);

        if (! in_array($borrow->status, [LibraryBorrowRequest::STATUS_PENDING, LibraryBorrowRequest::STATUS_APPROVED], true)) {
            return response()->json(['message' => 'This request can no longer be rejected.'], 422);
        }

        $data = $request->validate(['reason' => 'nullable|string|max:1000']);

        DB::transaction(function () use ($borrow, $request, $data) {
            $this->releaseCopy($borrow);
            $borrow->update([
                'status' => LibraryBorrowRequest::STATUS_REJECTED,
                'rejected_by' => optional($request->user())->id,
                'rejected_reason' => $data['reason'] ?? null,
            ]);
        });

        $book = LibraryBook::find($borrow->book_id);
        $user = User::find($borrow->user_id);
        $this->notifier()->notifyUser($user, $institutionId, 'rejected', $this->notifier()->rejectedToUser($institutionId, optional($user)->name ?? '', optional($book)->title ?? '', $data['reason'] ?? null), $borrow->id);

        return response()->json($this->transform($borrow->fresh(['book', 'copy', 'user'])));
    }

    // ---- QR scan / Issue ----------------------------------------------------

    public function scan(Request $request, $token)
    {
        $this->authorizeLibrary($request, ['issue_books', 'approve_borrow_requests']);

        $borrow = LibraryBorrowRequest::with(['book', 'copy', 'user'])
            ->where('institution_id', $this->institutionId($request))
            ->where('token', $token)
            ->first();

        if (! $borrow) {
            return response()->json(['message' => 'Approval notice not found.'], 404);
        }

        return response()->json($this->transform($borrow));
    }

    public function issue(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['issue_books']);

        $institutionId = $this->institutionId($request);
        $settings = $this->settings($request);
        $borrow = LibraryBorrowRequest::where('institution_id', $institutionId)->findOrFail($id);

        if (! in_array($borrow->status, [LibraryBorrowRequest::STATUS_APPROVED], true)) {
            return response()->json(['message' => 'Only approved requests can be issued.'], 422);
        }
        if (! $borrow->book_copy_id) {
            return response()->json(['message' => 'No copy is assigned to this request.'], 422);
        }

        $data = $request->validate([
            'due_date' => 'nullable|date',
        ]);

        $copy = LibraryBookCopy::find($borrow->book_copy_id);
        if (! $copy || ! $copy->isBorrowable()) {
            return response()->json(['message' => 'The assigned copy cannot be issued (lost or damaged).'], 422);
        }

        $dueDate = $data['due_date'] ?? $borrow->expected_return_date ?? Carbon::now()->addDays((int) $settings->max_borrow_days);

        $borrow = DB::transaction(function () use ($borrow, $copy, $request, $dueDate, $institutionId) {
            $borrow->update([
                'status' => LibraryBorrowRequest::STATUS_ISSUED,
                'issued_by' => optional($request->user())->id,
                'issued_at' => now(),
                'expected_return_date' => $dueDate,
            ]);
            $copy->update([
                'status' => LibraryBookCopy::STATUS_BORROWED,
                'current_borrower_id' => $borrow->user_id,
                'expected_available_date' => $dueDate,
            ]);

            LibraryBorrowTransaction::updateOrCreate(
                ['borrow_request_id' => $borrow->id],
                [
                    'institution_id' => $institutionId,
                    'user_id' => $borrow->user_id,
                    'book_id' => $borrow->book_id,
                    'book_copy_id' => $copy->id,
                    'issue_date' => now(),
                    'due_date' => $dueDate,
                    'status' => LibraryBorrowTransaction::STATUS_BORROWED,
                    'issued_by' => optional($request->user())->id,
                ]
            );

            return $borrow;
        });

        $book = LibraryBook::find($borrow->book_id);
        $user = User::find($borrow->user_id);
        $this->notifier()->notifyUser(
            $user,
            $institutionId,
            'issued',
            $this->notifier()->issuedToUser($institutionId, optional($user)->name ?? '', optional($book)->title ?? '', Carbon::parse($dueDate)->toFormattedDateString()),
            $borrow->id
        );

        return response()->json($this->transform($borrow->fresh(['book', 'copy', 'user'])));
    }

    // ---- Return / Lost ------------------------------------------------------

    public function returnBook(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['return_books']);

        $institutionId = $this->institutionId($request);
        $settings = $this->settings($request);
        $borrow = LibraryBorrowRequest::where('institution_id', $institutionId)->findOrFail($id);

        if ($borrow->status !== LibraryBorrowRequest::STATUS_ISSUED) {
            return response()->json(['message' => 'Only issued books can be returned.'], 422);
        }

        $fineInfo = $this->service()->calculateFine($settings, $borrow->expected_return_date, now());

        DB::transaction(function () use ($borrow, $request, $fineInfo, $institutionId) {
            $borrow->update([
                'status' => LibraryBorrowRequest::STATUS_RETURNED,
                'returned_by' => optional($request->user())->id,
                'returned_at' => now(),
            ]);

            if ($borrow->book_copy_id) {
                LibraryBookCopy::where('id', $borrow->book_copy_id)->update([
                    'status' => LibraryBookCopy::STATUS_AVAILABLE,
                    'current_borrower_id' => null,
                    'expected_available_date' => null,
                ]);
            }

            $transaction = LibraryBorrowTransaction::where('borrow_request_id', $borrow->id)->first();
            if ($transaction) {
                $transaction->update([
                    'return_date' => now(),
                    'status' => LibraryBorrowTransaction::STATUS_RETURNED,
                    'fine_amount' => $fineInfo['amount'],
                    'returned_by' => optional($request->user())->id,
                ]);
            }

            if ($fineInfo['amount'] > 0) {
                LibraryFine::updateOrCreate(
                    ['borrow_request_id' => $borrow->id],
                    [
                        'institution_id' => $institutionId,
                        'borrow_transaction_id' => optional($transaction)->id,
                        'user_id' => $borrow->user_id,
                        'book_id' => $borrow->book_id,
                        'overdue_days' => $fineInfo['overdue_days'],
                        'fine_amount' => $fineInfo['amount'],
                        'status' => LibraryFine::STATUS_UNPAID,
                    ]
                );
            }
        });

        $book = LibraryBook::find($borrow->book_id);
        $user = User::find($borrow->user_id);
        $this->notifier()->notifyUser($user, $institutionId, 'returned', $this->notifier()->returnedToUser($institutionId, optional($user)->name ?? '', optional($book)->title ?? ''), $borrow->id);

        return response()->json([
            'request' => $this->transform($borrow->fresh(['book', 'copy', 'user'])),
            'fine' => $fineInfo,
        ]);
    }

    public function markLostOrDamaged(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['return_books', 'manage_book_copies']);

        $institutionId = $this->institutionId($request);
        $borrow = LibraryBorrowRequest::where('institution_id', $institutionId)->findOrFail($id);

        $data = $request->validate(['condition' => 'required|in:lost,damaged']);

        DB::transaction(function () use ($borrow, $data, $request) {
            if ($borrow->book_copy_id) {
                LibraryBookCopy::where('id', $borrow->book_copy_id)->update([
                    'status' => $data['condition'],
                    'condition' => $data['condition'],
                    'current_borrower_id' => null,
                    'expected_available_date' => null,
                ]);
            }
            $borrow->update([
                'status' => LibraryBorrowRequest::STATUS_RETURNED,
                'returned_by' => optional($request->user())->id,
                'returned_at' => now(),
            ]);
            LibraryBorrowTransaction::where('borrow_request_id', $borrow->id)->update([
                'status' => LibraryBorrowTransaction::STATUS_LOST,
                'return_date' => now(),
            ]);
        });

        return response()->json($this->transform($borrow->fresh(['book', 'copy', 'user'])));
    }

    public function cancel(Request $request, $id)
    {
        $institutionId = $this->institutionId($request);
        $borrow = LibraryBorrowRequest::where('institution_id', $institutionId)->findOrFail($id);

        // Owner can cancel own pending/approved request; managers can cancel any.
        $isOwner = (int) $borrow->user_id === (int) optional($request->user())->id;
        if (! $isOwner) {
            $this->authorizeLibrary($request, ['approve_borrow_requests', 'reject_borrow_requests']);
        }

        if (! in_array($borrow->status, [LibraryBorrowRequest::STATUS_PENDING, LibraryBorrowRequest::STATUS_APPROVED], true)) {
            return response()->json(['message' => 'This request can no longer be cancelled.'], 422);
        }

        DB::transaction(function () use ($borrow) {
            $this->releaseCopy($borrow);
            $borrow->update(['status' => LibraryBorrowRequest::STATUS_CANCELLED]);
        });

        return response()->json($this->transform($borrow->fresh(['book', 'copy', 'user'])));
    }

    // ---- Operational lists --------------------------------------------------

    public function borrowed(Request $request)
    {
        $this->authorizeLibrary($request, ['view_borrowed_books', 'approve_borrow_requests', 'view_library_menu']);

        $rows = $this->scopedQuery($request)
            ->where('status', LibraryBorrowRequest::STATUS_ISSUED)
            ->orderBy('expected_return_date')
            ->get();

        return response()->json($this->collection($rows));
    }

    public function dueForReturn(Request $request)
    {
        $this->authorizeLibrary($request, ['view_due_for_return', 'send_library_reminders', 'view_borrowed_books']);

        $days = (int) $request->get('days', $this->settings($request)->default_reminder_days ?: 2);
        $threshold = Carbon::now()->addDays(max(0, $days))->endOfDay();

        $rows = LibraryBorrowRequest::with(['book', 'copy', 'user'])
            ->where('institution_id', $this->institutionId($request))
            ->where('status', LibraryBorrowRequest::STATUS_ISSUED)
            ->whereNotNull('expected_return_date')
            ->whereDate('expected_return_date', '<=', $threshold)
            ->orderBy('expected_return_date')
            ->get();

        return response()->json($this->collection($rows));
    }

    public function overdue(Request $request)
    {
        $this->authorizeLibrary($request, ['view_overdue_books', 'manage_library_fines', 'view_library_menu']);

        $institutionId = $this->institutionId($request);
        $settings = $this->settings($request);

        $rows = LibraryBorrowRequest::with(['book', 'copy', 'user'])
            ->where('institution_id', $institutionId)
            ->where('status', LibraryBorrowRequest::STATUS_ISSUED)
            ->whereNotNull('expected_return_date')
            ->whereDate('expected_return_date', '<', Carbon::now()->toDateString())
            ->orderBy('expected_return_date')
            ->get();

        // Keep an unpaid fine record in sync so it appears under Fines Management.
        foreach ($rows as $borrow) {
            $fineInfo = $this->service()->calculateFine($settings, $borrow->expected_return_date, now());
            if ($fineInfo['amount'] > 0) {
                $existing = LibraryFine::where('borrow_request_id', $borrow->id)->first();
                if (! $existing || $existing->status === LibraryFine::STATUS_UNPAID) {
                    LibraryFine::updateOrCreate(
                        ['borrow_request_id' => $borrow->id],
                        [
                            'institution_id' => $institutionId,
                            'user_id' => $borrow->user_id,
                            'book_id' => $borrow->book_id,
                            'overdue_days' => $fineInfo['overdue_days'],
                            'fine_amount' => $fineInfo['amount'],
                            'status' => LibraryFine::STATUS_UNPAID,
                        ]
                    );
                }
            }
            LibraryBookCopy::where('id', $borrow->book_copy_id)->where('status', LibraryBookCopy::STATUS_BORROWED)
                ->update(['status' => LibraryBookCopy::STATUS_OVERDUE]);
        }

        return response()->json($this->collection($rows));
    }

    public function history(Request $request)
    {
        $this->authorizeLibrary($request, ['view_own_borrow_requests', 'view_library_reports', 'view_borrowed_books', 'view_library_menu']);

        $rows = $this->scopedQuery($request)
            ->whereIn('status', [
                LibraryBorrowRequest::STATUS_ISSUED,
                LibraryBorrowRequest::STATUS_RETURNED,
            ])
            ->orderByDesc('issued_at')
            ->get();

        return response()->json($this->collection($rows));
    }

    // ---- Reminders ----------------------------------------------------------

    public function sendReminder(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['send_library_reminders']);

        $institutionId = $this->institutionId($request);
        $borrow = LibraryBorrowRequest::with(['book', 'user'])
            ->where('institution_id', $institutionId)->findOrFail($id);

        $this->dispatchReminder($institutionId, $borrow);

        return response()->json(['message' => 'Reminder sent.']);
    }

    public function bulkReminder(Request $request)
    {
        $this->authorizeLibrary($request, ['send_library_reminders']);

        $institutionId = $this->institutionId($request);
        $data = $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);

        $rows = LibraryBorrowRequest::with(['book', 'user'])
            ->where('institution_id', $institutionId)
            ->whereIn('id', $data['ids'])
            ->get();

        foreach ($rows as $borrow) {
            $this->dispatchReminder($institutionId, $borrow);
        }

        return response()->json(['message' => 'Reminders sent.', 'count' => $rows->count()]);
    }

    protected function dispatchReminder(int $institutionId, LibraryBorrowRequest $borrow): void
    {
        $user = $borrow->user ?: User::find($borrow->user_id);
        $book = $borrow->book ?: LibraryBook::find($borrow->book_id);
        $dueDate = $borrow->expected_return_date ? Carbon::parse($borrow->expected_return_date) : null;
        $isOverdue = $dueDate && $dueDate->lt(Carbon::now()->startOfDay());

        $message = $isOverdue
            ? $this->notifier()->overdueToUser($institutionId, optional($user)->name ?? '', optional($book)->title ?? '', $dueDate ? $dueDate->toFormattedDateString() : '')
            : $this->notifier()->reminderToUser($institutionId, optional($user)->name ?? '', optional($book)->title ?? '', $dueDate ? $dueDate->toFormattedDateString() : '');

        $this->notifier()->notifyUser($user, $institutionId, $isOverdue ? 'overdue' : 'reminder', $message, $borrow->id);
    }

    // ---- Helpers ------------------------------------------------------------

    protected function scopedQuery(Request $request)
    {
        $query = LibraryBorrowRequest::with(['book', 'copy', 'user'])
            ->where('institution_id', $this->institutionId($request));

        // Users without management permissions only see their own records.
        if (! $this->hasAnyPermission($request, ['approve_borrow_requests', 'view_borrowed_books', 'view_library_reports', 'view_due_for_return', 'view_overdue_books'])) {
            $query->where('user_id', optional($request->user())->id);
        } elseif ($userId = $request->get('user_id')) {
            $query->where('user_id', $userId);
        }

        return $query;
    }

    protected function ensureCanSee(Request $request, LibraryBorrowRequest $borrow): void
    {
        $isOwner = (int) $borrow->user_id === (int) optional($request->user())->id;
        if ($isOwner) {
            return;
        }
        $this->authorizeLibrary($request, ['approve_borrow_requests', 'view_borrowed_books', 'view_library_reports', 'issue_books']);
    }

    protected function releaseCopy(LibraryBorrowRequest $borrow): void
    {
        if (! $borrow->book_copy_id) {
            return;
        }
        $copy = LibraryBookCopy::find($borrow->book_copy_id);
        if ($copy && in_array($copy->status, [LibraryBookCopy::STATUS_RESERVED, LibraryBookCopy::STATUS_REQUESTED], true)) {
            $copy->update([
                'status' => LibraryBookCopy::STATUS_AVAILABLE,
                'current_borrower_id' => null,
                'expected_available_date' => null,
            ]);
        }
    }

    protected function collection($rows)
    {
        return $rows->map(fn ($r) => $this->transform($r))->values();
    }

    protected function transform(LibraryBorrowRequest $borrow): array
    {
        $book = $borrow->relationLoaded('book') ? $borrow->book : $borrow->book()->first();
        $copy = $borrow->relationLoaded('copy') ? $borrow->copy : $borrow->copy()->first();
        $user = $borrow->relationLoaded('user') ? $borrow->user : $borrow->user()->first();

        $dueDate = $borrow->expected_return_date ? Carbon::parse($borrow->expected_return_date) : null;
        $now = Carbon::now()->startOfDay();
        $daysRemaining = $dueDate ? $now->diffInDays($dueDate, false) : null;

        return [
            'id' => $borrow->id,
            'institution_id' => $borrow->institution_id,
            'user_id' => $borrow->user_id,
            'user_name' => optional($user)->name,
            'user_phone' => optional($user)->phone_number,
            'book_id' => $borrow->book_id,
            'book_title' => optional($book)->title,
            'book_copy_id' => $borrow->book_copy_id,
            'copy_code' => optional($copy)->copy_code,
            'requested_from_datetime' => $borrow->requested_from_datetime,
            'requested_to_datetime' => $borrow->requested_to_datetime,
            'expected_return_date' => $borrow->expected_return_date,
            'status' => $borrow->status,
            'token' => $borrow->token,
            'requested_at' => $borrow->requested_at,
            'approved_at' => $borrow->approved_at,
            'rejected_reason' => $borrow->rejected_reason,
            'issued_at' => $borrow->issued_at,
            'returned_at' => $borrow->returned_at,
            'days_remaining' => $daysRemaining,
            'overdue_days' => ($daysRemaining !== null && $daysRemaining < 0) ? abs($daysRemaining) : 0,
        ];
    }
}
