<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\LetterSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class LetterSettingsController extends Controller
{
    use ResolvesLettersContext;

    public function show(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['manage_letter_settings', 'view_letters_menu'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $institutionId = $this->institutionId($request);
        $settings = LetterSetting::firstOrCreate(
            ['institution_id' => $institutionId],
            ['serial_prefix' => 'LTR-', 'serial_counter' => 0]
        );

        return response()->json($this->formatSettings($settings));
    }

    public function update(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['manage_letter_settings'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'company_name' => 'nullable|string|max:255',
            'default_signer_title' => 'nullable|string|max:255',
            'default_footer_text' => 'nullable|string',
            'serial_prefix' => 'nullable|string|max:100',
            'letterhead' => 'nullable|file|max:5120|mimes:jpg,jpeg,png,gif,webp',
            'footer' => 'nullable|file|max:5120|mimes:jpg,jpeg,png,gif,webp',
            'logo' => 'nullable|file|max:5120|mimes:jpg,jpeg,png,gif,webp',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $institutionId = $this->institutionId($request);
        $settings = LetterSetting::firstOrCreate(
            ['institution_id' => $institutionId],
            ['serial_prefix' => 'LTR-', 'serial_counter' => 0]
        );

        $settings->fill($request->only([
            'company_name', 'default_signer_title', 'default_footer_text', 'serial_prefix',
        ]));

        foreach (['letterhead' => 'letterhead_path', 'footer' => 'footer_path', 'logo' => 'logo_path'] as $field => $column) {
            if ($request->hasFile($field)) {
                if ($settings->{$column}) {
                    Storage::disk('public')->delete($settings->{$column});
                }
                $settings->{$column} = $request->file($field)->store('letters/branding/'.$institutionId, 'public');
            }
        }

        $settings->save();

        return response()->json(['message' => 'Letter settings saved.', 'settings' => $this->formatSettings($settings)]);
    }

    protected function formatSettings(LetterSetting $settings)
    {
        return [
            'id' => $settings->id,
            'institution_id' => $settings->institution_id,
            'company_name' => $settings->company_name,
            'default_signer_title' => $settings->default_signer_title,
            'default_footer_text' => $settings->default_footer_text,
            'serial_prefix' => $settings->serial_prefix,
            'serial_counter' => $settings->serial_counter,
            'letterhead_url' => $settings->letterhead_path ? Storage::disk('public')->url($settings->letterhead_path) : null,
            'footer_url' => $settings->footer_path ? Storage::disk('public')->url($settings->footer_path) : null,
            'logo_url' => $settings->logo_path ? Storage::disk('public')->url($settings->logo_path) : null,
        ];
    }
}
