<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\LetterTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LetterTemplateController extends Controller
{
    use ResolvesLettersContext;

    public function index(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['manage_letter_templates', 'create_letters', 'view_letters_menu'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $templates = LetterTemplate::query()
            ->with('category:id,name')
            ->where('institution_id', $this->institutionId($request))
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json($templates);
    }

    public function store(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['manage_letter_templates', 'create_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|integer',
            'subject' => 'nullable|string|max:500',
            'header_html' => 'nullable|string',
            'body_html' => 'nullable|string',
            'footer_html' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $template = LetterTemplate::create([
            'institution_id' => $this->institutionId($request),
            'category_id' => $request->category_id,
            'name' => $request->name,
            'subject' => $request->subject,
            'header_html' => $request->header_html,
            'body_html' => $request->body_html,
            'footer_html' => $request->footer_html,
            'created_by' => optional($request->user())->id,
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Template created.', 'template' => $template], 201);
    }

    public function update(Request $request, LetterTemplate $template)
    {
        if (! $this->canAccessInstitution($request, $template->institution_id)) {
            return response()->json(['message' => 'Template not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['manage_letter_templates'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'nullable|integer',
            'subject' => 'nullable|string|max:500',
            'header_html' => 'nullable|string',
            'body_html' => 'nullable|string',
            'footer_html' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $template->fill($request->only(['name', 'category_id', 'subject', 'header_html', 'body_html', 'footer_html', 'is_active']));
        $template->save();

        return response()->json(['message' => 'Template updated.', 'template' => $template]);
    }

    public function destroy(Request $request, LetterTemplate $template)
    {
        if (! $this->canAccessInstitution($request, $template->institution_id)) {
            return response()->json(['message' => 'Template not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['manage_letter_templates'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $template->is_active = false;
        $template->save();

        return response()->json(['message' => 'Template removed.']);
    }
}
