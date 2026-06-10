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
        return response()->json(GeneralSetting::current());
    }

    public function update(Request $request)
    {
        $user = $request->user();
        if (! $user || ! $user->hasAnyRole(['super-admin', 'system-super-admin', 'institution-admin', 'admin'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'student_registration_fee' => 'required|numeric|min:0',
            'registration_fee_currency' => 'nullable|string|max:10',
            'registration_fee_period' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $settings = GeneralSetting::current();
        $settings->update($validator->validated());

        return response()->json([
            'message' => 'General settings updated.',
            'data' => $settings,
        ]);
    }
}
