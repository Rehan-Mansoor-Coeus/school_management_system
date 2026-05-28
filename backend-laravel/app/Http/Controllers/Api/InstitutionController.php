<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Institution;
use App\InstitutionSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class InstitutionController extends Controller
{
    private function normalizeJsonArrayFields(array $data, array $keys)
    {
        foreach ($keys as $key) {
            if (! array_key_exists($key, $data)) {
                continue;
            }
            if (is_string($data[$key])) {
                $decoded = json_decode($data[$key], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $data[$key] = $decoded;
                }
            }
        }
        return $data;
    }

    public function index(Request $request)
    {
        $query = Institution::query()->with('settings');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('code', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('country')) {
            $query->where('country', $request->country);
        }

        $perPage = (int) ($request->get('per_page', 10));
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;

        return response()->json($query->orderBy('name')->paginate($perPage));
    }

    public function show($id)
    {
        $institution = Institution::with('settings')->findOrFail($id);

        return response()->json($institution);
    }

    public function myInstitution(Request $request)
    {
        $user = $request->user();

        if (! $user || ! $user->institution_id) {
            return response()->json(['message' => 'No institution assigned to this user.'], 404);
        }

        $institution = Institution::with('settings')->find($user->institution_id);

        if (! $institution) {
            return response()->json(['message' => 'Institution not found.'], 404);
        }

        return response()->json($institution);
    }

    public function store(Request $request)
    {
        $normalized = $this->normalizeJsonArrayFields($request->all(), [
            'academic_structure',
            'fee_structure',
            'grading_system',
            'academic_calendar',
            'payment_settings',
        ]);

        $validator = Validator::make($normalized, [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:institutions,code',
            'type' => 'required|in:university,college,school,vocational,technical,training',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:255',
            'currency' => 'nullable|string|max:10',
            'timezone' => 'nullable|string|max:64',
            'language' => 'nullable|in:en,fr',
            'is_active' => 'nullable|boolean',
            'subscription_plan' => 'nullable|string|max:100',

            'academic_structure' => 'nullable|array',
            'fee_structure' => 'nullable|array',
            'grading_system' => 'nullable|array',
            'academic_calendar' => 'nullable|array',
            'payment_settings' => 'nullable|array',

            'logo' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'letterhead' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:4096',
            'registrar_signature' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'official_stamp' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institution = Institution::create($request->only([
            'name',
            'code',
            'type',
            'email',
            'phone',
            'address',
            'city',
            'country',
            'website',
            'currency',
            'timezone',
            'language',
            'is_active',
            'subscription_plan',
        ]));

        $this->handleBrandUploads($request, $institution);

        $settingsPayload = $this->normalizeJsonArrayFields($request->only(['academic_structure', 'fee_structure', 'grading_system', 'academic_calendar', 'payment_settings']), [
            'academic_structure',
            'fee_structure',
            'grading_system',
            'academic_calendar',
            'payment_settings',
        ]);

        InstitutionSetting::updateOrCreate(['institution_id' => $institution->id], $settingsPayload);

        return response()->json(['message' => 'Institution created successfully.', 'institution' => $institution->load('settings')], 201);
    }

    public function update(Request $request, $id)
    {
        $institution = Institution::with('settings')->findOrFail($id);

        $normalized = $this->normalizeJsonArrayFields($request->all(), [
            'academic_structure',
            'fee_structure',
            'grading_system',
            'academic_calendar',
            'payment_settings',
        ]);

        $validator = Validator::make($normalized, [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:institutions,code,' . $institution->id,
            'type' => 'required|in:university,college,school,vocational,technical,training',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:255',
            'currency' => 'nullable|string|max:10',
            'timezone' => 'nullable|string|max:64',
            'language' => 'nullable|in:en,fr',
            'is_active' => 'nullable|boolean',
            'subscription_plan' => 'nullable|string|max:100',

            'academic_structure' => 'nullable|array',
            'fee_structure' => 'nullable|array',
            'grading_system' => 'nullable|array',
            'academic_calendar' => 'nullable|array',
            'payment_settings' => 'nullable|array',

            'logo' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'letterhead' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:4096',
            'registrar_signature' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'official_stamp' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $institution->update($request->only([
            'name',
            'code',
            'type',
            'email',
            'phone',
            'address',
            'city',
            'country',
            'website',
            'currency',
            'timezone',
            'language',
            'is_active',
            'subscription_plan',
        ]));

        $this->handleBrandUploads($request, $institution);

        $settingsPayload = $this->normalizeJsonArrayFields($request->only(['academic_structure', 'fee_structure', 'grading_system', 'academic_calendar', 'payment_settings']), [
            'academic_structure',
            'fee_structure',
            'grading_system',
            'academic_calendar',
            'payment_settings',
        ]);

        InstitutionSetting::updateOrCreate(['institution_id' => $institution->id], $settingsPayload);

        return response()->json(['message' => 'Institution updated successfully.', 'institution' => $institution->fresh()->load('settings')]);
    }

    public function destroy($id)
    {
        $institution = Institution::findOrFail($id);
        $institution->delete();

        return response()->json(['message' => 'Institution deleted successfully.']);
    }

    public function getSettings($id)
    {
        $institution = Institution::findOrFail($id);
        $settings = InstitutionSetting::firstOrCreate(['institution_id' => $institution->id]);

        return response()->json($settings);
    }

    public function updateSettings(Request $request, $id)
    {
        $institution = Institution::findOrFail($id);

        $normalized = $this->normalizeJsonArrayFields($request->all(), [
            'academic_structure',
            'fee_structure',
            'grading_system',
            'academic_calendar',
            'payment_settings',
        ]);

        $validator = Validator::make($normalized, [
            'academic_structure' => 'nullable|array',
            'fee_structure' => 'nullable|array',
            'grading_system' => 'nullable|array',
            'academic_calendar' => 'nullable|array',
            'payment_settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settingsPayload = collect($normalized)->only([
            'academic_structure',
            'fee_structure',
            'grading_system',
            'academic_calendar',
            'payment_settings',
        ])->filter(function ($value) {
            return $value !== null;
        })->all();

        $settings = InstitutionSetting::updateOrCreate(
            ['institution_id' => $institution->id],
            $settingsPayload
        );

        return response()->json([
            'message' => 'Institution settings updated successfully.',
            'settings' => $settings,
        ]);
    }

    public function uploadLogo(Request $request, $id)
    {
        return $this->uploadFiles($request, $id, 'logo');
    }

    public function uploadLetterhead(Request $request, $id)
    {
        return $this->uploadFiles($request, $id, 'letterhead');
    }

    public function uploadSignature(Request $request, $id)
    {
        return $this->uploadFiles($request, $id, 'registrar_signature');
    }

    public function uploadStamp(Request $request, $id)
    {
        return $this->uploadFiles($request, $id, 'official_stamp');
    }

    public function uploadFiles(Request $request, $id, $type = null)
    {
        $institution = Institution::findOrFail($id);

        $allowed = ['logo', 'letterhead', 'registrar_signature', 'official_stamp'];
        if (! $type || ! in_array($type, $allowed, true)) {
            return response()->json(['message' => 'Invalid upload type.'], 422);
        }

        $rules = [
            'logo' => 'required|file|mimes:jpg,jpeg,png,webp|max:2048',
            'letterhead' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:4096',
            'registrar_signature' => 'required|file|mimes:jpg,jpeg,png,webp|max:2048',
            'official_stamp' => 'required|file|mimes:jpg,jpeg,png,webp|max:2048',
        ];

        $validator = Validator::make($request->all(), [
            'file' => $rules[$type],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('file');
        $path = $file->storeAs("institutions/{$institution->id}", $type . '.' . $file->getClientOriginalExtension(), 'public');

        $this->deleteOldPublicFile($institution->{$type});
        $institution->{$type} = $path;
        $institution->save();

        $institution = $institution->fresh();
        $urlKey = $type . '_url';

        return response()->json([
            'message' => 'File uploaded successfully.',
            'path' => $path,
            'url' => $institution->{$urlKey},
        ]);
    }

    private function handleBrandUploads(Request $request, Institution $institution)
    {
        foreach (['logo', 'letterhead', 'registrar_signature', 'official_stamp'] as $field) {
            if (! $request->hasFile($field)) {
                continue;
            }

            $file = $request->file($field);
            $path = $file->storeAs("institutions/{$institution->id}", $field . '.' . $file->getClientOriginalExtension(), 'public');

            $this->deleteOldPublicFile($institution->{$field});
            $institution->{$field} = $path;
        }

        $institution->save();
    }

    private function deleteOldPublicFile($path)
    {
        if (! $path) {
            return;
        }

        try {
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        } catch (\Exception $e) {
            // ignore
        }
    }
}
