<?php

namespace App\Http\Controllers\Api\Library;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Library\Concerns\ResolvesLibraryContext;
use App\Library\LibraryCategory;
use Illuminate\Http\Request;

class LibraryCategoryController extends Controller
{
    use ResolvesLibraryContext;

    public function index(Request $request)
    {
        $this->authorizeLibrary($request, ['manage_book_categories', 'view_books', 'register_books', 'view_library_menu']);

        $categories = LibraryCategory::where('institution_id', $this->institutionId($request))
            ->withCount('books')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $this->authorizeLibrary($request, ['manage_book_categories']);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $category = LibraryCategory::create([
            'institution_id' => $this->institutionId($request),
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        return response()->json($category, 201);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['manage_book_categories']);

        $category = LibraryCategory::where('institution_id', $this->institutionId($request))->findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $category->update($data);

        return response()->json($category);
    }

    public function destroy(Request $request, $id)
    {
        $this->authorizeLibrary($request, ['manage_book_categories']);

        $category = LibraryCategory::where('institution_id', $this->institutionId($request))->findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }
}
