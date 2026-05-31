<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\LetterCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LetterCategoryController extends Controller
{
    use ResolvesLettersContext;

    public function index(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['manage_letter_categories', 'view_letters_menu', 'create_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $categories = LetterCategory::query()
            ->where('institution_id', $this->institutionId($request))
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['manage_letter_categories'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $category = LetterCategory::create([
            'institution_id' => $this->institutionId($request),
            'name' => $request->name,
            'description' => $request->description,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json(['message' => 'Category created.', 'category' => $category], 201);
    }

    public function update(Request $request, LetterCategory $category)
    {
        if (! $this->canAccessInstitution($request, $category->institution_id)) {
            return response()->json(['message' => 'Category not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['manage_letter_categories'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $category->fill($request->only(['name', 'description', 'is_active']));
        $category->save();

        return response()->json(['message' => 'Category updated.', 'category' => $category]);
    }

    public function destroy(Request $request, LetterCategory $category)
    {
        if (! $this->canAccessInstitution($request, $category->institution_id)) {
            return response()->json(['message' => 'Category not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['manage_letter_categories'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $category->is_active = false;
        $category->save();

        return response()->json(['message' => 'Category removed.']);
    }
}
