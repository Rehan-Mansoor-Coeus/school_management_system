<?php

namespace App\Http\Controllers\Api;

use App\GeneralSetting;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GeneralSettingsController extends Controller
{
    public function show()
    {
        $settings = GeneralSetting::current();

        return response()->json([
            'per_student_license_fee' => (float) $settings->per_student_license_fee,
            'per_student_license_currency' => $settings->per_student_license_currency ?: 'USD',
            'per_student_license_period' => $settings->per_student_license_period ?: 'per_semester',
            // Legacy keys kept read-only for older clients; registration fee is institution-scoped.
            'student_registration_fee' => (float) $settings->student_registration_fee,
            'registration_fee_currency' => $settings->registration_fee_currency,
            'registration_fee_period' => $settings->registration_fee_period,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        if (! $user || ! $user->hasAnyRole(['super-admin', 'system-super-admin'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'per_student_license_fee' => 'required|numeric|min:0',
            'per_student_license_currency' => 'nullable|string|max:10',
            'per_student_license_period' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settings = GeneralSetting::current();
        $settings->update($validator->validated());

        return response()->json([
            'message' => 'General settings updated.',
            'data' => [
                'per_student_license_fee' => (float) $settings->per_student_license_fee,
                'per_student_license_currency' => $settings->per_student_license_currency ?: 'USD',
                'per_student_license_period' => $settings->per_student_license_period ?: 'per_semester',
            ],
        ]);
    }
}
