<?php

namespace App\Http\Controllers\Api\Library;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Library\Concerns\ResolvesLibraryContext;
use App\Library\LibraryBook;
use App\Library\LibraryBookReview;
use App\Library\LibraryBorrowTransaction;
use Illuminate\Http\Request;

class LibraryReviewController extends Controller
{
    use ResolvesLibraryContext;

    public function index(Request $request, $bookId)
    {
        $this->authorizeLibrary($request, ['view_books', 'borrow_books', 'view_library_menu']);

        $reviews = LibraryBookReview::with('user:id,name')
            ->where('institution_id', $this->institutionId($request))
            ->where('book_id', $bookId)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (LibraryBookReview $review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'user_name' => optional($review->user)->name,
                    'created_at' => $review->created_at,
                ];
            });

        return response()->json($reviews);
    }

    public function store(Request $request, $bookId)
    {
        $this->authorizeLibrary($request, ['rate_books', 'comment_on_books']);

        $institutionId = $this->institutionId($request);
        $book = LibraryBook::where('institution_id', $institutionId)->findOrFail($bookId);
        $user = $request->user();

        $data = $request->validate([
            'rating' => 'nullable|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        if (empty($data['rating']) && empty($data['comment'])) {
            return response()->json(['message' => 'Provide a rating or a comment.'], 422);
        }

        // Only users who have borrowed the book may review it.
        $hasBorrowed = LibraryBorrowTransaction::where('institution_id', $institutionId)
            ->where('book_id', $book->id)
            ->where('user_id', $user->id)
            ->exists();
        if (! $hasBorrowed && ! $this->hasAnyPermission($request, ['manage_book_categories'])) {
            return response()->json(['message' => 'You can only review books you have borrowed.'], 422);
        }

        $review = LibraryBookReview::create([
            'institution_id' => $institutionId,
            'book_id' => $book->id,
            'user_id' => $user->id,
            'rating' => $data['rating'] ?? null,
            'comment' => $data['comment'] ?? null,
        ]);

        return response()->json($review->load('user:id,name'), 201);
    }
}
