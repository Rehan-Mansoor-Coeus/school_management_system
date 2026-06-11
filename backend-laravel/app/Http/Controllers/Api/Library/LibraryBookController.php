<?php

namespace App\Http\Controllers\Api\Library;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Library\Concerns\ResolvesLibraryContext;
use App\Library\LibraryBook;
use App\Library\LibraryBorrowTransaction;
use App\Library\Services\LibraryCopyService;
use App\Library\Services\LibraryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LibraryBookController extends Controller
{
    use ResolvesLibraryContext;

    protected function service(): LibraryService
    {
        return app(LibraryService::class);
    }

    public function index(Request $request)
    {
        $this->authorizeLibrary($request, ['view_books', 'register_books', 'manage_book_copies', 'borrow_books', 'view_library_menu']);

        $books = $this->baseQuery($request)->get();

        return response()->json($books->map(fn ($book) => $this->transform($book))->values());
    }

    public function search(Request $request)
    {
        $this->authorizeLibrary($request, ['borrow_books', 'view_books', 'view_library_menu']);

        $books = $this->baseQuery($request)->limit(100)->get();

        return response()->json($books->map(fn ($book) => $this->transform($book))->values());
    }

    public function show(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['view_books', 'borrow_books', 'register_books', 'view_library_menu']);

        $book = LibraryBook::with(['bookCategory', 'copies', 'reviews.user'])
            ->where('institution_id', $this->institutionId($request))
            ->findOrFail($id);

        $data = $this->transform($book);
        $data['copies'] = $book->copies;
        $data['reviews'] = $book->reviews->map(function ($review) {
            return [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'user_name' => optional($review->user)->name,
                'created_at' => $review->created_at,
            ];
        })->values();

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $this->authorizeLibrary($request, ['register_books']);

        $data = $request->validate($this->rules($request));

        $payload = [
            'institution_id' => $this->institutionId($request),
            'category_id' => $data['category_id'] ?? null,
            'title' => $data['title'],
            'isbn' => ! empty($data['isbn']) ? $data['isbn'] : null,
            'author' => $data['author'] ?? null,
            'publisher' => $data['publisher'] ?? null,
            'publication_year' => $data['publication_year'] ?? null,
            'edition' => $data['edition'] ?? null,
            'description' => $data['description'] ?? null,
            'language' => $data['language'] ?? null,
            'shelf_location' => $data['shelf_location'] ?? null,
            'status' => $data['status'] ?? 'active',
            'created_by' => optional($request->user())->id,
        ];

        if ($request->hasFile('cover_image')) {
            $payload['cover_image_path'] = $request->file('cover_image')->store('library/covers', 'public');
        }

        $existing = null;
        if (! empty($payload['isbn'])) {
            $existing = LibraryBook::where('institution_id', $payload['institution_id'])
                ->where('isbn', $payload['isbn'])
                ->first();
        }

        if ($existing) {
            return response()->json([
                'message' => "A book with ISBN \"{$payload['isbn']}\" is already registered (\"{$existing->title}\").",
                'existing_book_id' => $existing->id,
            ], 422);
        }

        $book = LibraryBook::create($payload);

        $copyCount = (int) ($data['number_of_copies'] ?? 0);
        if ($copyCount > 0) {
            app(LibraryCopyService::class)->createForBook($book, $copyCount, [
                'accession_prefix' => $data['accession_prefix'] ?? null,
                'shelf_location' => $payload['shelf_location'],
            ]);
        }

        $response = $this->transform($book->fresh(['bookCategory', 'copies']));
        $response['copies_created'] = $copyCount;

        return response()->json($response, 201);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['register_books']);

        $book = LibraryBook::where('institution_id', $this->institutionId($request))->findOrFail($id);

        $data = $request->validate($this->rules($request, $book->id));

        $book->fill([
            'category_id' => $data['category_id'] ?? null,
            'title' => $data['title'],
            'isbn' => ! empty($data['isbn']) ? $data['isbn'] : null,
            'author' => $data['author'] ?? null,
            'publisher' => $data['publisher'] ?? null,
            'publication_year' => $data['publication_year'] ?? null,
            'edition' => $data['edition'] ?? null,
            'description' => $data['description'] ?? null,
            'language' => $data['language'] ?? null,
            'shelf_location' => $data['shelf_location'] ?? null,
            'status' => $data['status'] ?? $book->status,
        ]);

        if ($request->hasFile('cover_image')) {
            $book->cover_image_path = $request->file('cover_image')->store('library/covers', 'public');
        }

        $book->save();

        return response()->json($this->transform($book->fresh('bookCategory')));
    }

    public function destroy(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['register_books']);

        $book = LibraryBook::where('institution_id', $this->institutionId($request))->findOrFail($id);
        $book->delete();

        return response()->json(['message' => 'Book deleted.']);
    }

    public function frequentlySigned(Request $request)
    {
        $this->authorizeLibrary($request, ['view_frequently_signed_books', 'view_library_reports', 'view_library_menu']);

        $institutionId = $this->institutionId($request);

        $counts = LibraryBorrowTransaction::select('book_id', DB::raw('COUNT(*) as borrow_count'))
            ->where('institution_id', $institutionId)
            ->groupBy('book_id')
            ->orderByDesc('borrow_count')
            ->limit(20)
            ->pluck('borrow_count', 'book_id');

        if ($counts->isEmpty()) {
            return response()->json([]);
        }

        $books = LibraryBook::with(['bookCategory', 'copies'])
            ->where('institution_id', $institutionId)
            ->whereIn('id', $counts->keys())
            ->get();

        $result = $books->map(function ($book) use ($counts) {
            $data = $this->transform($book);
            $data['borrow_count'] = (int) ($counts[$book->id] ?? 0);

            return $data;
        })->sortByDesc('borrow_count')->values();

        return response()->json($result);
    }

    protected function baseQuery(Request $request)
    {
        $query = LibraryBook::with(['bookCategory', 'copies'])
            ->where('institution_id', $this->institutionId($request));

        if ($q = trim((string) $request->get('q', ''))) {
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('isbn', 'like', "%{$q}%")
                    ->orWhere('author', 'like', "%{$q}%")
                    ->orWhere('publisher', 'like', "%{$q}%");
            });
        }

        if ($categoryId = $request->get('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return $query->orderBy('title');
    }

    protected function transform(LibraryBook $book): array
    {
        $availability = $this->service()->availabilityForBook($book);
        $borrowCount = LibraryBorrowTransaction::where('book_id', $book->id)->count();

        $cat = $book->bookCategory;

        return [
            'id' => $book->id,
            'institution_id' => $book->institution_id,
            'category_id' => $book->category_id,
            'category' => $cat ? ['id' => $cat->id, 'name' => $cat->name] : null,
            'title' => $book->title,
            'isbn' => $book->isbn,
            'author' => $book->author,
            'publisher' => $book->publisher,
            'publication_year' => $book->publication_year,
            'edition' => $book->edition,
            'description' => $book->description,
            'language' => $book->language,
            'shelf_location' => $book->shelf_location,
            'status' => $book->status,
            'cover_image_path' => $book->cover_image_path,
            'cover_image_url' => $book->cover_image_url,
            'average_rating' => $this->service()->averageRating($book->id),
            'borrow_count' => $borrowCount,
            'availability' => $availability,
            'created_at' => $book->created_at,
        ];
    }

    protected function rules(Request $request, ?int $bookId = null): array
    {
        $settings = $this->settings($request);
        $institutionId = $this->institutionId($request);

        $isbnRules = [
            $settings->isbn_mandatory ? 'required' : 'nullable',
            'string',
            'max:255',
            Rule::unique('library_books', 'isbn')
                ->where(fn ($q) => $q->where('institution_id', $institutionId))
                ->ignore($bookId),
        ];

        return [
            'title' => 'required|string|max:255',
            'category_id' => 'nullable|integer|exists:library_categories,id',
            'isbn' => $isbnRules,
            'author' => ($settings->author_mandatory ? 'required' : 'nullable').'|string|max:255',
            'publisher' => ($settings->publisher_mandatory ? 'required' : 'nullable').'|string|max:255',
            'publication_year' => ($settings->publication_year_mandatory ? 'required' : 'nullable').'|string|max:10',
            'shelf_location' => ($settings->shelf_location_mandatory ? 'required' : 'nullable').'|string|max:255',
            'edition' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'language' => 'nullable|string|max:100',
            'status' => 'nullable|in:active,inactive',
            'cover_image' => 'nullable|image|max:5120',
            'number_of_copies' => 'nullable|integer|min:0|max:100',
            'accession_prefix' => 'nullable|string|max:50',
        ];
    }
}
