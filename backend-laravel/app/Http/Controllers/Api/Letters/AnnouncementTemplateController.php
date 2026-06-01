<?php

namespace App\Http\Controllers\Api\Letters;

use App\AnnouncementTemplate;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnnouncementTemplateController extends Controller
{
    use ResolvesLettersContext;

    public function index(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['create_announcements', 'view_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = AnnouncementTemplate::query()
            ->where('institution_id', $this->institutionId($request))
            ->where('is_active', true)
            ->orderBy('name');

        if ($search = trim((string) $request->get('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['create_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:50',
            'subject' => 'nullable|string|max:500',
            'header_html' => 'nullable|string',
            'body_html' => 'nullable|string',
            'footer_html' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $template = AnnouncementTemplate::create([
            'institution_id' => $this->institutionId($request),
            'name' => $request->name,
            'category' => $request->get('category', 'general'),
            'subject' => $request->subject,
            'header_html' => $request->header_html,
            'body_html' => $request->body_html,
            'footer_html' => $request->footer_html,
            'created_by' => optional($request->user())->id,
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Template saved.', 'template' => $template], 201);
    }

    public function update(Request $request, AnnouncementTemplate $announcementTemplate)
    {
        if (! $this->canAccessInstitution($request, $announcementTemplate->institution_id)) {
            return response()->json(['message' => 'Template not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['create_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:50',
            'subject' => 'nullable|string|max:500',
            'header_html' => 'nullable|string',
            'body_html' => 'nullable|string',
            'footer_html' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $announcementTemplate->fill($request->only(['name', 'category', 'subject', 'header_html', 'body_html', 'footer_html', 'is_active']));
        $announcementTemplate->save();

        return response()->json(['message' => 'Template updated.', 'template' => $announcementTemplate]);
    }

    public function destroy(Request $request, AnnouncementTemplate $announcementTemplate)
    {
        if (! $this->canAccessInstitution($request, $announcementTemplate->institution_id)) {
            return response()->json(['message' => 'Template not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['create_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $announcementTemplate->is_active = false;
        $announcementTemplate->save();

        return response()->json(['message' => 'Template removed.']);
    }
}
