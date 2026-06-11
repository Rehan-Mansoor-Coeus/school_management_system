<?php

namespace App\Http\Controllers\Api\Library;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Library\Concerns\ResolvesLibraryContext;
use App\Library\LibrarySetting;
use Illuminate\Http\Request;

class LibrarySettingsController extends Controller
{
    use ResolvesLibraryContext;

    public function show(Request $request)
    {
        $this->authorizeLibrary($request, ['manage_library_settings', 'view_library_menu', 'view_library_reports']);

        return response()->json($this->settings($request));
    }

    public function update(Request $request)
    {
        $this->authorizeLibrary($request, ['manage_library_settings']);

        $data = $request->validate([
            'max_borrow_days' => 'nullable|integer|min:1|max:365',
            'max_books_per_user' => 'nullable|integer|min:1|max:100',
            'fine_per_day' => 'nullable|numeric|min:0',
            'grace_period_days' => 'nullable|integer|min:0|max:60',
            'allow_unlimited_borrowing' => 'boolean',
            'require_approval' => 'boolean',
            'isbn_mandatory' => 'boolean',
            'author_mandatory' => 'boolean',
            'shelf_location_mandatory' => 'boolean',
            'publisher_mandatory' => 'boolean',
            'publication_year_mandatory' => 'boolean',
            'default_reminder_days' => 'nullable|integer|min:0|max:60',
            'whatsapp_notifications_enabled' => 'boolean',
            'email_notifications_enabled' => 'boolean',
            'block_borrow_on_unpaid_fines' => 'boolean',
            'librarian_user_ids' => 'nullable|array',
            'librarian_user_ids.*' => 'integer',
        ]);

        $settings = $this->settings($request);
        $settings->fill($data);
        $settings->institution_id = $this->institutionId($request);
        $settings->save();

        return response()->json($settings);
    }
}
