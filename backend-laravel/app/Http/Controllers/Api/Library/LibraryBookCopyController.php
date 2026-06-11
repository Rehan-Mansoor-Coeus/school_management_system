<?php

namespace App\Http\Controllers\Api\Library;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Library\Concerns\ResolvesLibraryContext;
use App\Library\LibraryBook;
use App\Library\LibraryBookCopy;
use App\Library\Services\LibraryCopyService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LibraryBookCopyController extends Controller
{
    use ResolvesLibraryContext;

    protected function copyService(): LibraryCopyService
    {
        return app(LibraryCopyService::class);
    }

    public function index(Request $request)
    {
        $this->authorizeLibrary($request, ['manage_book_copies', 'view_books', 'view_library_menu']);

        $query = LibraryBookCopy::with(['book', 'borrower:id,name'])
            ->where('institution_id', $this->institutionId($request));

        if ($bookId = $request->get('book_id')) {
            $query->where('book_id', $bookId);
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($q = trim((string) $request->get('q', ''))) {
            $query->where(function ($sub) use ($q) {
                $sub->where('copy_code', 'like', "%{$q}%")
                    ->orWhere('barcode', 'like', "%{$q}%");
            });
        }

        return response()->json($query->orderBy('copy_code')->get());
    }

    /** Suggest the next accession number for a book (for single-copy form). */
    public function suggestAccession(Request $request)
    {
        $this->authorizeLibrary($request, ['manage_book_copies', 'register_books']);

        $data = $request->validate([
            'book_id' => 'required|integer',
            'accession_prefix' => 'nullable|string|max:50',
        ]);

        $institutionId = $this->institutionId($request);
        LibraryBook::where('institution_id', $institutionId)->findOrFail($data['book_id']);

        return response()->json([
            'suggested_copy_code' => $this->copyService()->suggestNextAccessionNumber(
                $institutionId,
                (int) $data['book_id'],
                $data['accession_prefix'] ?? null
            ),
        ]);
    }

    /** Add one physical copy (accession number optional — auto-generated if omitted). */
    public function store(Request $request)
    {
        $this->authorizeLibrary($request, ['manage_book_copies']);

        $institutionId = $this->institutionId($request);

        $data = $request->validate([
            'book_id' => 'required|integer',
            'copy_code' => [
                'nullable', 'string', 'max:255',
                Rule::unique('library_book_copies', 'copy_code')->where(fn ($q) => $q->where('institution_id', $institutionId)),
            ],
            'barcode' => 'nullable|string|max:255',
            'shelf_location' => 'nullable|string|max:255',
            'condition' => 'nullable|in:new,good,damaged,lost',
            'status' => 'nullable|in:available,requested,borrowed,reserved,overdue,lost,damaged',
            'accession_prefix' => 'nullable|string|max:50',
        ]);

        $book = LibraryBook::where('institution_id', $institutionId)->findOrFail($data['book_id']);

        $copies = $this->copyService()->createForBook($book, 1, [
            'copy_code' => $data['copy_code'] ?? null,
            'accession_prefix' => $data['accession_prefix'] ?? null,
            'barcode' => $data['barcode'] ?? null,
            'shelf_location' => $data['shelf_location'] ?? null,
            'condition' => $data['condition'] ?? 'good',
            'status' => $data['status'] ?? LibraryBookCopy::STATUS_AVAILABLE,
        ]);

        return response()->json($copies[0]->load('book'), 201);
    }

    /** Add multiple copies at once with auto-generated accession numbers. */
    public function bulkStore(Request $request)
    {
        $this->authorizeLibrary($request, ['manage_book_copies']);

        $institutionId = $this->institutionId($request);

        $data = $request->validate([
            'book_id' => 'required|integer',
            'quantity' => 'required|integer|min:1|max:100',
            'accession_prefix' => 'nullable|string|max:50',
            'shelf_location' => 'nullable|string|max:255',
            'condition' => 'nullable|in:new,good,damaged,lost',
            'status' => 'nullable|in:available,requested,borrowed,reserved,overdue,lost,damaged',
        ]);

        $book = LibraryBook::where('institution_id', $institutionId)->findOrFail($data['book_id']);

        $copies = $this->copyService()->createForBook($book, (int) $data['quantity'], [
            'accession_prefix' => $data['accession_prefix'] ?? null,
            'shelf_location' => $data['shelf_location'] ?? null,
            'condition' => $data['condition'] ?? 'good',
            'status' => $data['status'] ?? LibraryBookCopy::STATUS_AVAILABLE,
        ]);

        return response()->json([
            'message' => count($copies).' copy/copies added.',
            'count' => count($copies),
            'copies' => collect($copies)->map(fn ($c) => $c->load('book')),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['manage_book_copies']);

        $institutionId = $this->institutionId($request);
        $copy = LibraryBookCopy::where('institution_id', $institutionId)->findOrFail($id);

        $data = $request->validate([
            'copy_code' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('library_book_copies', 'copy_code')
                    ->ignore($copy->id)
                    ->where(fn ($q) => $q->where('institution_id', $institutionId)),
            ],
            'barcode' => 'nullable|string|max:255',
            'shelf_location' => 'nullable|string|max:255',
            'condition' => 'nullable|in:new,good,damaged,lost',
            'status' => 'nullable|in:available,requested,borrowed,reserved,overdue,lost,damaged',
        ]);

        $copy->fill($data);
        $copy->save();

        return response()->json($copy->load('book'));
    }

    public function destroy(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['manage_book_copies']);

        $copy = LibraryBookCopy::where('institution_id', $this->institutionId($request))->findOrFail($id);

        if (in_array($copy->status, [LibraryBookCopy::STATUS_BORROWED, LibraryBookCopy::STATUS_RESERVED, LibraryBookCopy::STATUS_OVERDUE], true)) {
            return response()->json(['message' => 'Cannot delete a copy that is currently borrowed or reserved.'], 422);
        }

        $copy->delete();

        return response()->json(['message' => 'Copy deleted.']);
    }
}
