<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Letter;
use App\LetterSetting;
use App\Services\Letters\LetterAssetHelper;
use App\Services\Letters\LetterWorkflowService;
use Illuminate\Http\Request;

class LetterPublicController extends Controller
{
    protected $workflow;

    public function __construct(LetterWorkflowService $workflow)
    {
        $this->workflow = $workflow;
    }

    public function verify(Request $request, Letter $letter)
    {
        if (in_array($letter->status, ['draft', 'cancelled'], true)) {
            return response()->json(['message' => 'Letter not available.'], 404);
        }

        return response()->json($this->buildPreviewPayload($letter, $request));
    }

    protected function buildPreviewPayload(Letter $letter, ?Request $request = null): array
    {
        $letter->load(['recipients', 'ccRecipients', 'approvals.user:id,name', 'category', 'attachments']);
        $settings = LetterSetting::where('institution_id', $letter->institution_id)->first();
        $recipient = $letter->recipients->first();
        $letterDate = optional($letter->sent_at ?: $letter->created_at)->format('M d, Y');
        $verifyUrl = $this->verifyUrl($letter);

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

        return [
            'preview' => [
                'reference' => $letter->reference,
                'date' => $letterDate,
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
                'letterhead_url' => LetterAssetHelper::url($settings ? $settings->letterhead_path : null, $request),
                'footer_url' => LetterAssetHelper::url($settings ? $settings->footer_path : null, $request),
                'logo_url' => LetterAssetHelper::url($settings ? $settings->logo_path : null, $request),
                'barcode_value' => $letter->reference,
                'verify_url' => $verifyUrl,
                'qr_code_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data='.urlencode($verifyUrl),
                'barcode_url' => 'https://barcode.tec-it.com/barcode.ashx?data='.urlencode($verifyUrl).'&code=Code128&translate-esc=on',
                'editor_indicator' => $editorApproval ? [
                    'name' => optional($editorApproval->user)->name,
                    'signature_url' => $editorApproval->signature_path ? LetterAssetHelper::url($editorApproval->signature_path, $request) : null,
                ] : null,
                'approver_indicator' => $approverApproval ? [
                    'name' => optional($approverApproval->user)->name,
                    'signature_url' => $approverApproval->signature_path ? LetterAssetHelper::url($approverApproval->signature_path, $request) : null,
                ] : null,
                'signer_signature_url' => $signerApproval && $signerApproval->signature_path
                    ? LetterAssetHelper::url($signerApproval->signature_path, $request)
                    : null,
                'signer_name' => optional(optional($signerApproval)->user)->name ?: $letter->author_name,
            ],
        ];
    }

    protected function verifyUrl(Letter $letter): string
    {
        $frontend = rtrim(env('FRONTEND_URL', config('app.url')), '/');

        return $frontend.'/letters/verify/'.$letter->id;
    }
}
