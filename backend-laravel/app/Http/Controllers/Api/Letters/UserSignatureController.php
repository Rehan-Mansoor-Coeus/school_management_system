<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\UserSignature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserSignatureController extends Controller
{
    use ResolvesLettersContext;

    public function index(Request $request)
    {
        $userId = $request->get('user_id', optional($request->user())->id);
        if ((int) $userId !== (int) optional($request->user())->id && ! $this->hasAnyPermission($request, ['manage_letter_settings'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $signatures = UserSignature::query()
            ->where('institution_id', $this->institutionId($request))
            ->where('user_id', $userId)
            ->orderBy('signature_type')
            ->get()
            ->map(function ($sig) {
                return array_merge($sig->toArray(), [
                    'url' => Storage::disk('public')->url($sig->signature_path),
                ]);
            });

        return response()->json($signatures);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'signature_type' => 'required|in:editor,approver,signer',
            'signature' => 'required|file|max:2048|mimes:jpg,jpeg,png,gif,webp',
            'user_id' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $userId = $request->get('user_id', optional($request->user())->id);
        if ((int) $userId !== (int) optional($request->user())->id && ! $this->hasAnyPermission($request, ['manage_letter_settings'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $institutionId = $this->institutionId($request);
        $path = $request->file('signature')->store('letters/signatures/'.$institutionId, 'public');

        UserSignature::query()
            ->where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->where('signature_type', $request->signature_type)
            ->update(['is_active' => false]);

        $signature = UserSignature::create([
            'institution_id' => $institutionId,
            'user_id' => $userId,
            'signature_type' => $request->signature_type,
            'signature_path' => $path,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Signature uploaded.',
            'signature' => array_merge($signature->toArray(), ['url' => Storage::disk('public')->url($path)]),
        ], 201);
    }
}
