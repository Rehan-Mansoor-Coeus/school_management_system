<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\User;
use App\UserSignature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserLetterWorkflowController extends Controller
{
    use ResolvesLettersContext;

    protected $permissionMap = [
        'can_edit_letters' => ['edit_awaiting_letters', 'view_awaiting_editing', 'forward_letter_to_approver'],
        'can_approve_letters' => ['approve_letters', 'reject_letters', 'view_awaiting_approval', 'forward_letter_to_signer'],
        'can_sign_letters' => ['sign_letters', 'bulk_sign_letters', 'view_awaiting_signature'],
    ];

    public function show(Request $request, User $user)
    {
        if (! $this->canAccessUser($request, $user)) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        return response()->json($this->workflowPayload($user));
    }

    public function update(Request $request, User $user)
    {
        if (! $this->canAccessUser($request, $user)) {
            return response()->json(['message' => 'User not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['manage_letter_settings', 'users.edit', 'edit_users', 'manage_users'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'can_edit_letters' => 'nullable|boolean',
            'can_approve_letters' => 'nullable|boolean',
            'can_sign_letters' => 'nullable|boolean',
            'editor_signature_data' => 'nullable|string',
            'approver_signature_data' => 'nullable|string',
            'signer_signature_data' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $this->syncDirectPermissions($user, $request);

        foreach ([
            'editor_signature_data' => 'editor',
            'approver_signature_data' => 'approver',
            'signer_signature_data' => 'signer',
        ] as $field => $type) {
            if ($request->filled($field)) {
                $this->storeSignatureData($user, $request->input($field), $type);
            }
        }

        return response()->json([
            'message' => 'Letter workflow settings saved.',
            'workflow' => $this->workflowPayload($user->fresh()),
        ]);
    }

    protected function workflowPayload(User $user)
    {
        $institutionId = (int) $user->institution_id;
        $signatures = UserSignature::query()
            ->where('institution_id', $institutionId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->get()
            ->keyBy('signature_type');

        return [
            'can_edit_letters' => $user->hasPermissionTo('edit_awaiting_letters'),
            'can_approve_letters' => $user->hasPermissionTo('approve_letters'),
            'can_sign_letters' => $user->hasPermissionTo('sign_letters'),
            'signatures' => [
                'editor' => $this->signatureUrl(optional($signatures->get('editor'))->signature_path ?? null),
                'approver' => $this->signatureUrl(optional($signatures->get('approver'))->signature_path ?? null),
                'signer' => $this->signatureUrl(optional($signatures->get('signer'))->signature_path ?? null),
            ],
        ];
    }

    protected function syncDirectPermissions(User $user, Request $request)
    {
        foreach ($this->permissionMap as $flag => $permissions) {
            if (! $request->has($flag)) {
                continue;
            }
            if ($request->boolean($flag)) {
                $user->givePermissionTo($permissions);
            } else {
                foreach ($permissions as $permission) {
                    if ($user->hasDirectPermission($permission)) {
                        $user->revokePermissionTo($permission);
                    }
                }
            }
        }
    }

    protected function storeSignatureData(User $user, $dataUrl, $type)
    {
        if (! preg_match('/^data:image\/png;base64,/', $dataUrl)) {
            throw new \InvalidArgumentException('Invalid signature data.');
        }

        $binary = base64_decode(substr($dataUrl, strpos($dataUrl, ',') + 1));
        if ($binary === false) {
            throw new \InvalidArgumentException('Unable to decode signature.');
        }

        $institutionId = (int) $user->institution_id;
        $filename = 'letters/signatures/'.$institutionId.'/user_'.$user->id.'_'.$type.'_'.Str::random(8).'.png';
        Storage::disk('public')->put($filename, $binary);

        UserSignature::query()
            ->where('institution_id', $institutionId)
            ->where('user_id', $user->id)
            ->where('signature_type', $type)
            ->update(['is_active' => false]);

        UserSignature::create([
            'institution_id' => $institutionId,
            'user_id' => $user->id,
            'signature_type' => $type,
            'signature_path' => $filename,
            'is_active' => true,
        ]);
    }

    protected function signatureUrl($path)
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }

    protected function canAccessUser(Request $request, User $user)
    {
        return (int) $user->institution_id === $this->institutionId($request);
    }
}
