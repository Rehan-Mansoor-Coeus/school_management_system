<?php

namespace App\Http\Controllers\Api\Library;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Library\Concerns\ResolvesLibraryContext;
use App\Library\LibraryBook;
use App\Library\LibraryBookCopy;
use App\Library\LibraryBorrowRequest;
use App\Library\LibraryBorrowTransaction;
use App\Library\LibraryFine;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LibraryDashboardController extends Controller
{
    use ResolvesLibraryContext;

    public function index(Request $request)
    {
        $user = $request->user();
        $isStudent = $this->hasAnyPermission($request, ['borrow_books'])
            && ! $this->hasAnyPermission($request, ['register_books', 'approve_borrow_requests', 'view_library_reports']);

        if ($isStudent) {
            return response()->json($this->studentDashboard($request));
        }

        $this->authorizeLibrary($request, ['view_library_reports', 'view_library_menu', 'approve_borrow_requests']);

        $institutionId = $this->institutionId($request);

        $totalBooks = LibraryBook::where('institution_id', $institutionId)->count();
        $totalCopies = LibraryBookCopy::where('institution_id', $institutionId)->count();
        $availableCopies = LibraryBookCopy::where('institution_id', $institutionId)
            ->where('status', LibraryBookCopy::STATUS_AVAILABLE)->count();
        $borrowedBooks = LibraryBorrowRequest::where('institution_id', $institutionId)
            ->where('status', LibraryBorrowRequest::STATUS_ISSUED)->count();
        $pendingRequests = LibraryBorrowRequest::where('institution_id', $institutionId)
            ->where('status', LibraryBorrowRequest::STATUS_PENDING)->count();
        $overdueBooks = LibraryBorrowRequest::where('institution_id', $institutionId)
            ->where('status', LibraryBorrowRequest::STATUS_ISSUED)
            ->whereNotNull('expected_return_date')
            ->whereDate('expected_return_date', '<', Carbon::now()->toDateString())
            ->count();
        $unpaidFines = (float) LibraryFine::where('institution_id', $institutionId)
            ->where('status', LibraryFine::STATUS_UNPAID)->sum('fine_amount');

        $categoryExpr = 'COALESCE(library_categories.name, "Uncategorised")';
        $byCategory = LibraryBorrowTransaction::query()
            ->where('library_borrow_transactions.institution_id', $institutionId)
            ->join('library_books', 'library_books.id', '=', 'library_borrow_transactions.book_id')
            ->leftJoin('library_categories', 'library_categories.id', '=', 'library_books.category_id')
            ->select(DB::raw("{$categoryExpr} as category"), DB::raw('COUNT(*) as count'))
            ->groupBy(DB::raw($categoryExpr))
            ->orderByDesc('count')
            ->get();

        $frequent = LibraryBorrowTransaction::query()
            ->where('library_borrow_transactions.institution_id', $institutionId)
            ->join('library_books', 'library_books.id', '=', 'library_borrow_transactions.book_id')
            ->select('library_books.id', 'library_books.title', DB::raw('COUNT(*) as borrow_count'))
            ->groupBy('library_books.id', 'library_books.title')
            ->orderByDesc('borrow_count')
            ->limit(8)
            ->get();

        return response()->json([
            'total_books' => $totalBooks,
            'total_copies' => $totalCopies,
            'available_copies' => $availableCopies,
            'borrowed_books' => $borrowedBooks,
            'pending_requests' => $pendingRequests,
            'overdue_books' => $overdueBooks,
            'unpaid_fines' => $unpaidFines,
            'borrowed_by_category' => $byCategory,
            'frequently_signed' => $frequent,
        ]);
    }

    protected function studentDashboard(Request $request): array
    {
        $userId = (int) $request->user()->id;
        $institutionId = $this->institutionId($request);
        $today = Carbon::now()->toDateString();

        $totalBorrowed = LibraryBorrowTransaction::where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->count();

        $booksInKeeping = LibraryBorrowRequest::where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->where('status', LibraryBorrowRequest::STATUS_ISSUED)
            ->count();

        $dueForReturn = LibraryBorrowRequest::where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->where('status', LibraryBorrowRequest::STATUS_ISSUED)
            ->whereNotNull('expected_return_date')
            ->whereDate('expected_return_date', '<=', $today)
            ->count();

        $unpaidFines = (float) LibraryFine::where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->where('status', LibraryFine::STATUS_UNPAID)
            ->sum('fine_amount');

        return [
            'student_view' => true,
            'total_borrowed' => $totalBorrowed,
            'books_in_keeping' => $booksInKeeping,
            'due_for_return' => $dueForReturn,
            'unpaid_fines' => $unpaidFines,
        ];
    }
}
