<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\Http\Controllers\Api\Letters\Concerns\VerifiesLetterOtp;
use App\Letter;
use App\LetterApproval;
use App\LetterAttachment;
use App\LetterCcRecipient;
use App\LetterComment;
use App\LetterRecipient;
use App\LetterSetting;
use App\LetterTemplate;
use App\Services\Letters\LetterWorkflowService;
use App\Services\Letters\LetterMessagingService;
use App\UserSignature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class LetterController extends Controller
{
    use ResolvesLettersContext;
    use VerifiesLetterOtp;

    protected $workflow;
    protected $letterMessaging;

    public function __construct(LetterWorkflowService $workflow, LetterMessagingService $letterMessaging)
    {
        $this->workflow = $workflow;
        $this->letterMessaging = $letterMessaging;
    }

    public function counts(Request $request)
    {
        if (! $this->hasAnyLetterAccess($request)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $institutionId = $this->institutionId($request);
        $base = Letter::query()->where('institution_id', $institutionId);

        $payload = ['all' => 0];

        if ($this->hasAnyPermission($request, ['view_letters_menu', 'create_letters'])) {
            $payload['all'] = (clone $base)->count();
            $payload['rejected'] = (clone $base)->where('status', 'rejected')->count();
        }

        if ($this->hasAnyPermission($request, ['view_awaiting_editing', 'edit_awaiting_letters'])) {
            $payload['awaiting_editing'] = (clone $base)->where('status', 'awaiting_editing')->count();
        }

        if ($this->hasAnyPermission($request, ['view_awaiting_approval', 'approve_letters'])) {
            $payload['awaiting_approval'] = (clone $base)->where('status', 'awaiting_approval')->count();
        }

        if ($this->hasAnyPermission($request, ['view_awaiting_signature', 'sign_letters', 'bulk_sign_letters'])) {
            $payload['awaiting_signature'] = (clone $base)->where('status', 'awaiting_signature')->count();
        }

        if ($this->hasAnyPermission($request, ['view_ready_to_send_letters', 'send_letters', 'bulk_send_letters'])) {
            $payload['ready_to_send'] = (clone $base)->where('status', 'ready_to_send')->count();
        }

        if ($this->hasAnyPermission($request, ['view_sent_letters'])) {
            $payload['sent'] = (clone $base)->where('status', 'sent')->count();
        }

        if ($this->hasAnyPermission($request, ['print_letters', 'download_letters'])) {
            $payload['printable'] = (clone $base)->whereIn('status', ['ready_to_send', 'sent'])->count();
        }

        return response()->json($payload);
    }

    public function index(Request $request)
    {
        if (! $this->hasAnyLetterAccess($request)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (! $this->canViewStatusFilter($request, $request->get('status'), $request->get('status_in'))) {
            return response()->json(['message' => 'Unauthorized for this letter queue.'], 403);
        }

        $institutionId = $this->institutionId($request);
        $query = Letter::query()
            ->with([
                'category:id,name',
                'creator:id,name',
                'updater:id,name',
                'recipients',
                'approvals.user:id,name',
            ])
            ->where('institution_id', $institutionId);

        if ($request->filled('status_in')) {
            $query->whereIn('status', array_filter(explode(',', $request->status_in)));
        } elseif ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhere('author_name', 'like', "%{$search}%")
                    ->orWhereHas('recipients', function ($r) use ($search) {
                        $r->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $sortBy = in_array($request->get('sort_by'), ['subject', 'reference', 'status', 'created_at']) ? $request->sort_by : 'created_at';
        $sortDir = $request->get('sort_dir') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $paginator = $query->paginate((int) $request->get('per_page', 15));
        $paginator->getCollection()->transform(function (Letter $letter) {
            return $this->formatLetterListItem($letter);
        });

        return response()->json($paginator);
    }

    public function show(Request $request, Letter $letter)
    {
        if (! $this->canAccessInstitution($request, $letter->institution_id)) {
            return response()->json(['message' => 'Letter not found.'], 404);
        }

        $letter->load([
            'category', 'template', 'recipients', 'ccRecipients', 'attachments',
            'comments.user:id,name', 'approvals.user:id,name', 'creator:id,name', 'histories.user:id,name',
        ]);

        return response()->json($this->formatLetter($letter));
    }

    public function store(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['create_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (is_string($request->recipients)) {
            $request->merge(['recipients' => json_decode($request->recipients, true) ?: []]);
        }
        if (is_string($request->cc_recipients)) {
            $request->merge(['cc_recipients' => json_decode($request->cc_recipients, true) ?: []]);
        }

        $validator = Validator::make($request->all(), [
            'category_id' => 'nullable|integer',
            'template_id' => 'nullable|integer',
            'people_type' => 'nullable|string|max:50',
            'author_name' => 'nullable|string|max:255',
            'subject' => 'required|string|max:500',
            'header_html' => 'nullable|string',
            'body_html' => 'nullable|string',
            'footer_html' => 'nullable|string',
            'comment' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
            'forward_to' => 'nullable|in:editor,approver,signer,sender',
            'save_as_template' => 'nullable|boolean',
            'template_name' => 'nullable|string|max:255',
            'recipients' => 'required|array|min:1',
            'recipients.*.name' => 'required|string|max:255',
            'recipients.*.email' => 'nullable|string|max:255',
            'recipients.*.phone' => 'nullable|string|max:50',
            'recipients.*.address' => 'nullable|string',
            'recipients.*.recipient_type' => 'nullable|string|max:50',
            'recipients.*.recipient_id' => 'nullable|integer',
            'recipients.*.placeholder_data' => 'nullable|array',
            'cc_recipients' => 'nullable|array',
            'cc_recipients.*.name' => 'required|string|max:255',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $institutionId = $this->institutionId($request);
        $userId = optional($request->user())->id;
        $settings = LetterSetting::firstOrCreate(['institution_id' => $institutionId], ['serial_prefix' => 'LTR-', 'serial_counter' => 0]);

        $status = $request->forward_to === 'editor' ? 'awaiting_editing' : 'draft';
        if ($request->forward_to === 'approver') {
            $status = 'awaiting_approval';
        } elseif ($request->forward_to === 'signer') {
            $status = 'awaiting_signature';
        } elseif ($request->forward_to === 'sender') {
            $status = 'ready_to_send';
        }

        return DB::transaction(function () use ($request, $institutionId, $userId, $settings, $status) {
            $reference = $this->workflow->generateReference($institutionId);

            $letter = Letter::create([
                'institution_id' => $institutionId,
                'category_id' => $request->category_id,
                'template_id' => $request->template_id,
                'reference' => $reference,
                'people_type' => $request->people_type ?: 'custom',
                'author_name' => $request->author_name,
                'subject' => $request->subject,
                'header_html' => $request->header_html,
                'body_html' => $request->body_html,
                'footer_html' => $request->footer_html,
                'status' => $status,
                'comment' => $request->comment,
                'scheduled_at' => $request->scheduled_at,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            $this->workflow->securityCodes($letter);
            $this->syncRecipients($letter, $request, $settings);

            if ($request->comment) {
                LetterComment::create([
                    'institution_id' => $institutionId,
                    'letter_id' => $letter->id,
                    'user_id' => $userId,
                    'role_stage' => 'creator',
                    'comment' => $request->comment,
                ]);
            }

            foreach ($this->attachmentFiles($request) as $file) {
                $path = $file->store('letters/attachments/'.$institutionId, 'public');
                LetterAttachment::create([
                    'institution_id' => $institutionId,
                    'letter_id' => $letter->id,
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ]);
            }

            if ($request->boolean('save_as_template') && $request->template_name) {
                LetterTemplate::create([
                    'institution_id' => $institutionId,
                    'category_id' => $request->category_id,
                    'name' => $request->template_name,
                    'subject' => $request->subject,
                    'header_html' => $request->header_html,
                    'body_html' => $request->body_html,
                    'footer_html' => $request->footer_html,
                    'created_by' => $userId,
                    'is_active' => true,
                ]);
            }

            $this->workflow->transition($letter, $status, $userId, 'Letter created');

            return response()->json(['message' => 'Letter created.', 'letter' => $this->formatLetter($letter->fresh(['recipients', 'ccRecipients', 'attachments']))], 201);
        });
    }

    public function update(Request $request, Letter $letter)
    {
        if (! $this->canAccessInstitution($request, $letter->institution_id)) {
            return response()->json(['message' => 'Letter not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['edit_letters', 'edit_awaiting_letters', 'approve_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (! in_array($letter->status, ['draft', 'awaiting_editing', 'awaiting_approval', 'rejected'], true)) {
            return response()->json(['message' => 'Letter cannot be edited in current status.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'subject' => 'sometimes|required|string|max:500',
            'header_html' => 'nullable|string',
            'body_html' => 'nullable|string',
            'footer_html' => 'nullable|string',
            'comment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $letter->fill($request->only(['subject', 'header_html', 'body_html', 'footer_html', 'comment']));
        $letter->updated_by = optional($request->user())->id;
        $letter->save();

        if ($request->comment) {
            LetterComment::create([
                'institution_id' => $letter->institution_id,
                'letter_id' => $letter->id,
                'user_id' => optional($request->user())->id,
                'role_stage' => $letter->status,
                'comment' => $request->comment,
            ]);
        }

        return response()->json(['message' => 'Letter updated.', 'letter' => $this->formatLetter($letter->fresh())]);
    }

    public function forward(Request $request, Letter $letter)
    {
        if (! $this->canAccessInstitution($request, $letter->institution_id)) {
            return response()->json(['message' => 'Letter not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'to' => 'required|in:editor,approver,signer,sender',
            'comment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $map = [
            'editor' => ['status' => 'awaiting_editing', 'permissions' => ['send_letter_to_editor', 'create_letters', 'edit_awaiting_letters']],
            'approver' => ['status' => 'awaiting_approval', 'permissions' => ['forward_letter_to_approver', 'edit_awaiting_letters']],
            'signer' => ['status' => 'awaiting_signature', 'permissions' => ['forward_letter_to_signer', 'approve_letters']],
            'sender' => ['status' => 'ready_to_send', 'permissions' => ['sign_letters', 'approve_letters']],
        ];

        $target = $map[$request->to];
        if (! $this->hasAnyPermission($request, $target['permissions'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $expectedStatus = [
            'editor' => ['draft', 'rejected'],
            'approver' => ['awaiting_editing'],
            'signer' => ['awaiting_approval'],
            'sender' => ['awaiting_signature'],
        ];
        if (! in_array($letter->status, $expectedStatus[$request->to] ?? [], true)) {
            return response()->json(['message' => 'Letter cannot be forwarded from current status.'], 422);
        }

        $signatureType = $request->to === 'approver' ? 'editor' : ($request->to === 'signer' ? 'approver' : null);
        $signaturePath = $signatureType
            ? optional($this->resolveUserSignature($letter->institution_id, optional($request->user())->id, $signatureType))->signature_path
            : null;

        $this->recordApproval($letter, $request, 'forward', $letter->status, $signaturePath);
        $this->workflow->transition($letter, $target['status'], optional($request->user())->id, $request->comment);

        return response()->json(['message' => 'Letter forwarded.', 'letter' => $this->formatLetter($letter->fresh())]);
    }

    public function approve(Request $request, Letter $letter)
    {
        if (! $this->canAccessInstitution($request, $letter->institution_id)) {
            return response()->json(['message' => 'Letter not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['approve_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($letter->status !== 'awaiting_approval') {
            return response()->json(['message' => 'Letter is not awaiting approval.'], 422);
        }

        if ($response = $this->ensureOtpVerified($request, $letter, 'approve')) {
            return $response;
        }

        $signature = $this->resolveUserSignature($letter->institution_id, optional($request->user())->id, 'approver');
        $this->recordApproval($letter, $request, 'approve', 'approver', optional($signature)->signature_path);
        $letter->approved_by = optional($request->user())->id;
        $letter->save();
        $this->workflow->transition($letter, 'awaiting_signature', optional($request->user())->id, $request->get('comment'));

        return response()->json(['message' => 'Letter approved.', 'letter' => $this->formatLetter($letter->fresh())]);
    }

    public function reject(Request $request, Letter $letter)
    {
        if (! $this->canAccessInstitution($request, $letter->institution_id)) {
            return response()->json(['message' => 'Letter not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['reject_letters', 'approve_letters', 'edit_awaiting_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($response = $this->ensureOtpVerified($request, $letter, 'reject')) {
            return $response;
        }

        $this->recordApproval($letter, $request, 'reject', $letter->status);
        $letter->rejected_by = optional($request->user())->id;
        $letter->save();
        $this->workflow->transition($letter, 'rejected', optional($request->user())->id, $request->get('comment'));

        return response()->json(['message' => 'Letter rejected.', 'letter' => $this->formatLetter($letter->fresh())]);
    }

    public function sign(Request $request, Letter $letter)
    {
        if (! $this->canAccessInstitution($request, $letter->institution_id)) {
            return response()->json(['message' => 'Letter not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['sign_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($letter->status !== 'awaiting_signature') {
            return response()->json(['message' => 'Letter is not awaiting signature.'], 422);
        }

        if ($response = $this->ensureOtpVerified($request, $letter, 'sign')) {
            return $response;
        }

        $signature = $this->resolveUserSignature($letter->institution_id, optional($request->user())->id, 'signer');
        $this->recordApproval($letter, $request, 'sign', 'signer', optional($signature)->signature_path);
        $letter->signed_by = optional($request->user())->id;
        $letter->save();
        $this->workflow->transition($letter, 'ready_to_send', optional($request->user())->id, $request->get('comment'));

        return response()->json(['message' => 'Letter signed.', 'letter' => $this->formatLetter($letter->fresh())]);
    }

    public function send(Request $request, Letter $letter)
    {
        if (! $this->canAccessInstitution($request, $letter->institution_id)) {
            return response()->json(['message' => 'Letter not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['send_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($letter->status !== 'ready_to_send') {
            return response()->json(['message' => 'Letter is not ready to send.'], 422);
        }

        if ($response = $this->ensureOtpVerified($request, $letter, 'send')) {
            return $response;
        }

        $this->recordApproval($letter, $request, 'send', 'sender');
        $this->workflow->transition($letter, 'sent', optional($request->user())->id, $request->get('comment'));
        $letter->sent_by = optional($request->user())->id;
        $letter->save();

        $queueResult = $this->letterMessaging->queueLetterDelivery($letter, optional($request->user())->id);

        return response()->json([
            'message' => 'Letter queued for WhatsApp delivery.',
            'letter' => $this->formatLetter($letter->fresh()),
            'queue' => $queueResult,
        ]);
    }

    public function bulk(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:delete,forward,approve,sign,send',
            'letter_ids' => 'required|array|min:1',
            'letter_ids.*' => 'integer',
            'to' => 'nullable|in:editor,approver,signer,sender',
            'comment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $institutionId = $this->institutionId($request);
        $letters = Letter::query()
            ->where('institution_id', $institutionId)
            ->whereIn('id', $request->letter_ids)
            ->get();

        $results = [];
        foreach ($letters as $letter) {
            try {
                if ($request->action === 'delete') {
                    if (! $this->hasAnyPermission($request, ['delete_letters'])) {
                        throw new \RuntimeException('Unauthorized');
                    }
                    $this->workflow->transition($letter, 'cancelled', optional($request->user())->id, 'Bulk delete');
                    $letter->delete();
                    $results[] = ['id' => $letter->id, 'status' => 'deleted'];
                    continue;
                }

                $subRequest = clone $request;
                if ($request->action === 'forward') {
                    $subRequest->merge(['to' => $request->to]);
                    $this->forward($subRequest, $letter);
                } elseif ($request->action === 'approve') {
                    $this->approve($subRequest, $letter);
                } elseif ($request->action === 'sign') {
                    $this->sign($subRequest, $letter);
                } elseif ($request->action === 'send') {
                    $this->send($subRequest, $letter);
                }
                $results[] = ['id' => $letter->id, 'status' => 'ok'];
            } catch (\Throwable $e) {
                $results[] = ['id' => $letter->id, 'status' => 'error', 'message' => $e->getMessage()];
            }
        }

        return response()->json(['message' => 'Bulk action completed.', 'results' => $results]);
    }

    public function preview(Request $request, Letter $letter)
    {
        if (! $this->canAccessInstitution($request, $letter->institution_id)) {
            return response()->json(['message' => 'Letter not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['view_letters_menu', 'print_letters', 'download_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $letter->load(['recipients', 'ccRecipients', 'approvals.user:id,name', 'category', 'attachments']);
        $settings = LetterSetting::where('institution_id', $letter->institution_id)->first();
        $recipient = $letter->recipients->first();
        $letterDate = optional($letter->sent_at ?: $letter->created_at)->format('M d, Y');

        $body = $recipient && $recipient->personalized_body_html
            ? $recipient->personalized_body_html
            : $this->workflow->personalize($letter->body_html, [
                'name' => optional($recipient)->name,
                'phone' => optional($recipient)->phone,
                'email' => optional($recipient)->email,
                'address' => optional($recipient)->address,
                'institution_name' => optional($settings)->company_name,
                'reference' => $letter->reference,
                'date' => $letterDate,
            ]);

        $editorApproval = $letter->approvals->first(function ($a) {
            return in_array($a->stage, ['awaiting_editing', 'editor'], true) || $a->action === 'forward';
        });
        $approverApproval = $letter->approvals->first(function ($a) {
            return $a->action === 'approve' || $a->stage === 'approver';
        });
        $signerApproval = $letter->approvals->first(function ($a) {
            return $a->action === 'sign' || $a->stage === 'signer';
        });

        return response()->json([
            'letter' => $this->formatLetter($letter),
            'preview' => [
                'reference' => $letter->reference,
                'date' => optional($letter->sent_at ?: $letter->created_at)->format('M d, Y'),
                'subject' => $letter->subject,
                'header_html' => $letter->header_html,
                'body_html' => $body,
                'footer_html' => $letter->footer_html ?: optional($settings)->default_footer_text,
                'recipient_name' => optional($recipient)->name,
                'recipient_address' => optional($recipient)->address,
                'author_name' => $letter->author_name,
                'signer_title' => optional($settings)->default_signer_title,
                'company_name' => optional($settings)->company_name,
                'cc' => $letter->ccRecipients->pluck('name'),
                'letterhead_url' => $settings && $settings->letterhead_path ? Storage::disk('public')->url($settings->letterhead_path) : null,
                'footer_url' => $settings && $settings->footer_path ? Storage::disk('public')->url($settings->footer_path) : null,
                'logo_url' => $settings && $settings->logo_path ? Storage::disk('public')->url($settings->logo_path) : null,
                'barcode_value' => $letter->barcode_value,
                'qr_code_value' => $letter->qr_code_value,
                'qr_code_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data='.urlencode($letter->qr_code_value ?: $letter->reference),
                'editor_indicator' => $editorApproval ? [
                    'name' => optional($editorApproval->user)->name,
                    'comment' => $editorApproval->comment,
                    'signature_url' => $editorApproval->signature_path ? Storage::disk('public')->url($editorApproval->signature_path) : null,
                ] : null,
                'approver_indicator' => $approverApproval ? [
                    'name' => optional($approverApproval->user)->name,
                    'comment' => $approverApproval->comment,
                    'signature_url' => $approverApproval->signature_path ? Storage::disk('public')->url($approverApproval->signature_path) : null,
                ] : null,
                'signer_signature_url' => $signerApproval && $signerApproval->signature_path
                    ? Storage::disk('public')->url($signerApproval->signature_path)
                    : null,
                'signer_name' => optional(optional($signerApproval)->user)->name ?: $letter->author_name,
                'approvals' => $letter->approvals,
                'attachments' => $letter->attachments->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'original_name' => $file->original_name,
                        'mime_type' => $file->mime_type,
                        'size' => $file->size,
                        'url' => Storage::disk('public')->url($file->path),
                    ];
                }),
            ],
        ]);
    }

    protected function attachmentFiles(Request $request): array
    {
        $files = $request->file('attachments');
        if (! $files) {
            return [];
        }

        return is_array($files) ? $files : [$files];
    }

    public function destroy(Request $request, Letter $letter)
    {
        if (! $this->canAccessInstitution($request, $letter->institution_id)) {
            return response()->json(['message' => 'Letter not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['delete_letters'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $this->workflow->transition($letter, 'cancelled', optional($request->user())->id, 'Deleted');
        $letter->delete();

        return response()->json(['message' => 'Letter deleted.']);
    }

    protected function syncRecipients(Letter $letter, Request $request, LetterSetting $settings)
    {
        foreach ($request->recipients as $row) {
            $placeholder = $row['placeholder_data'] ?? [];
            $data = array_merge([
                'name' => $row['name'],
                'phone' => $row['phone'] ?? '',
                'email' => $row['email'] ?? '',
                'address' => $row['address'] ?? '',
                'institution_name' => $settings->company_name,
                'reference' => $letter->reference,
                'date' => optional($letter->created_at)->format('M d, Y'),
            ], $placeholder);

            LetterRecipient::create([
                'institution_id' => $letter->institution_id,
                'letter_id' => $letter->id,
                'recipient_type' => $row['recipient_type'] ?? 'custom',
                'recipient_id' => $row['recipient_id'] ?? null,
                'name' => $row['name'],
                'email' => $row['email'] ?? null,
                'phone' => $row['phone'] ?? null,
                'address' => $row['address'] ?? null,
                'placeholder_data' => $placeholder,
                'personalized_body_html' => $this->workflow->personalize($letter->body_html, $data),
            ]);
        }

        foreach ($request->get('cc_recipients', []) as $row) {
            LetterCcRecipient::create([
                'institution_id' => $letter->institution_id,
                'letter_id' => $letter->id,
                'recipient_type' => $row['recipient_type'] ?? 'custom',
                'recipient_id' => $row['recipient_id'] ?? null,
                'name' => $row['name'],
                'email' => $row['email'] ?? null,
            ]);
        }
    }

    protected function recordApproval(Letter $letter, Request $request, $action, $stage, $signaturePath = null)
    {
        LetterApproval::create([
            'institution_id' => $letter->institution_id,
            'letter_id' => $letter->id,
            'user_id' => optional($request->user())->id,
            'action' => $action,
            'stage' => $stage,
            'comment' => $request->get('comment'),
            'signature_path' => $signaturePath,
        ]);
    }

    protected function formatLetter(Letter $letter)
    {
        $data = $this->formatLetterListItem($letter);
        if ($letter->relationLoaded('attachments')) {
            $data['attachments'] = $letter->attachments->map(function ($file) {
                return array_merge($file->toArray(), [
                    'url' => Storage::disk('public')->url($file->path),
                ]);
            });
        }

        return $data;
    }

    protected function formatLetterListItem(Letter $letter)
    {
        $data = $letter->toArray();
        $data['creator'] = $letter->relationLoaded('creator') ? $letter->creator : null;
        $data['updater'] = $letter->relationLoaded('updater') ? $letter->updater : null;
        $data['category'] = $letter->relationLoaded('category') ? $letter->category : null;
        $data['recipients'] = $letter->relationLoaded('recipients') ? $letter->recipients : [];

        if ($letter->relationLoaded('approvals')) {
            $data['edited_by'] = optional($this->findApprovalActor($letter, ['forward'], ['awaiting_editing', 'editor']))->name;
            $data['approved_by'] = optional($this->findApprovalActor($letter, ['approve'], ['approver']))->name;
            $data['signed_by'] = optional($this->findApprovalActor($letter, ['sign'], ['signer']))->name;
        }

        return $data;
    }

    protected function findApprovalActor(Letter $letter, array $actions, array $stages)
    {
        $approval = $letter->approvals->first(function ($item) use ($actions, $stages) {
            return in_array($item->action, $actions, true) || in_array($item->stage, $stages, true);
        });

        return optional($approval)->user;
    }

    protected function resolveUserSignature($institutionId, $userId, $type)
    {
        if (! $userId) {
            return null;
        }

        return UserSignature::query()
            ->where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->where('signature_type', $type)
            ->where('is_active', true)
            ->first();
    }

    protected function hasAnyLetterAccess(Request $request)
    {
        return $this->hasAnyPermission($request, [
            'view_letters_menu', 'create_letters', 'view_awaiting_editing', 'edit_awaiting_letters',
            'view_awaiting_approval', 'approve_letters', 'view_awaiting_signature', 'sign_letters',
            'view_ready_to_send_letters', 'send_letters', 'view_sent_letters', 'print_letters', 'download_letters',
        ]);
    }

    protected function canViewStatusFilter(Request $request, $status = null, $statusIn = null)
    {
        if (! $status && ! $statusIn) {
            return $this->hasAnyPermission($request, ['view_letters_menu', 'create_letters']);
        }

        $statuses = $statusIn ? array_filter(explode(',', $statusIn)) : [$status];
        $map = [
            'rejected' => ['view_letters_menu', 'create_letters'],
            'awaiting_editing' => ['view_awaiting_editing', 'edit_awaiting_letters', 'view_letters_menu'],
            'awaiting_approval' => ['view_awaiting_approval', 'approve_letters', 'view_letters_menu'],
            'awaiting_signature' => ['view_awaiting_signature', 'sign_letters', 'view_letters_menu'],
            'ready_to_send' => ['view_ready_to_send_letters', 'send_letters', 'view_letters_menu'],
            'sent' => ['view_sent_letters', 'print_letters', 'download_letters', 'view_letters_menu'],
            'draft' => ['view_letters_menu', 'create_letters'],
        ];

        foreach ($statuses as $item) {
            if ($item === 'ready_to_send' || $item === 'sent') {
                if ($this->hasAnyPermission($request, array_merge($map['ready_to_send'], $map['sent']))) {
                    continue;
                }
            }
            if (! isset($map[$item]) || ! $this->hasAnyPermission($request, $map[$item])) {
                return false;
            }
        }

        return true;
    }
}
