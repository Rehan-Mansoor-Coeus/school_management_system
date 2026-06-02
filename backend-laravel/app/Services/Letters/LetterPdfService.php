<?php

namespace App\Services\Letters;

use App\Letter;
use App\LetterRecipient;
use App\LetterSetting;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;

class LetterPdfService
{
    protected $workflow;

    public function __construct(LetterWorkflowService $workflow)
    {
        $this->workflow = $workflow;
    }

    public function generateForRecipient(Letter $letter, LetterRecipient $recipient, ?string $institutionName = null): string
    {
        $html = $this->renderHtml($letter, $recipient, $institutionName);
        $pdfBinary = $this->htmlToPdf($html);

        $safeName = preg_replace('/[^a-zA-Z0-9_-]+/', '_', $recipient->name) ?: 'recipient';
        $path = 'letters/pdfs/'.$letter->institution_id.'/'.$letter->id.'/'.$safeName.'_'.time().'.pdf';
        Storage::disk('public')->put($path, $pdfBinary);

        return $path;
    }

    public function renderHtml(Letter $letter, LetterRecipient $recipient, ?string $institutionName = null): string
    {
        $letter->loadMissing(['approvals.user:id,name', 'ccRecipients']);
        $settings = LetterSetting::where('institution_id', $letter->institution_id)->first();
        $letterDate = optional($letter->sent_at ?: $letter->created_at)->format('M d, Y');
        $verifyUrl = rtrim(env('FRONTEND_URL', config('app.url')), '/').'/letters/verify/'.$letter->id;

        $data = array_merge(
            [
                'name' => $recipient->name,
                'email' => $recipient->email,
                'phone' => $recipient->phone,
                'address' => $recipient->address,
                'institution_name' => $institutionName ?: optional($settings)->company_name,
                'reference' => $letter->reference,
                'date' => $letterDate,
            ],
            is_array($recipient->placeholder_data) ? $recipient->placeholder_data : []
        );

        $header = $this->workflow->personalize($letter->header_html, $data);
        $body = $recipient->personalized_body_html ?: $this->workflow->personalize($letter->body_html, $data);
        $footer = $this->workflow->personalize($letter->footer_html ?: optional($settings)->default_footer_text, $data);

        $editorApproval = $letter->approvals->first(function ($a) {
            return in_array($a->stage, ['awaiting_editing', 'editor'], true) || $a->action === 'forward';
        });
        $approverApproval = $letter->approvals->first(function ($a) {
            return $a->action === 'approve' || $a->stage === 'approver';
        });
        $signerApproval = $letter->approvals->first(function ($a) {
            return $a->action === 'sign' || $a->stage === 'signer';
        });

        return view('letters.pdf', [
            'letter' => $letter,
            'recipient' => $recipient,
            'settings' => $settings,
            'header_html' => $header,
            'body_html' => $body,
            'footer_html' => $footer,
            'institution_name' => $institutionName ?: optional($settings)->company_name,
            'letterhead_path' => LetterAssetHelper::pdfDataUri($settings ? $settings->letterhead_path : null),
            'footer_image_path' => LetterAssetHelper::pdfDataUri($settings ? $settings->footer_path : null),
            'logo_path' => LetterAssetHelper::pdfDataUri($settings ? $settings->logo_path : null),
            'barcode_url' => 'https://barcode.tec-it.com/barcode.ashx?data='.urlencode($verifyUrl).'&code=Code128&translate-esc=on',
            'qr_code_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data='.urlencode($verifyUrl),
            'editor_signature_path' => LetterAssetHelper::pdfDataUri(optional($editorApproval)->signature_path),
            'approver_signature_path' => LetterAssetHelper::pdfDataUri(optional($approverApproval)->signature_path),
            'signer_signature_path' => LetterAssetHelper::pdfDataUri(optional($signerApproval)->signature_path),
            'editor_name' => optional(optional($editorApproval)->user)->name,
            'approver_name' => optional(optional($approverApproval)->user)->name,
            'signer_name' => optional(optional($signerApproval)->user)->name ?: $letter->author_name,
            'signer_title' => optional($settings)->default_signer_title,
            'letter_date' => $letterDate,
            'cc' => $letter->ccRecipients->pluck('name')->all(),
        ])->render();
    }

    protected function assetPath(?string $relativePath): ?string
    {
        return LetterAssetHelper::pdfPath($relativePath);
    }

    protected function htmlToPdf(string $html): string
    {
        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}
