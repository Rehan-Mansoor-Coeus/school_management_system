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
        $settings = LetterSetting::where('institution_id', $letter->institution_id)->first();
        $data = array_merge(
            [
                'name' => $recipient->name,
                'email' => $recipient->email,
                'phone' => $recipient->phone,
                'address' => $recipient->address,
                'institution_name' => $institutionName,
                'reference' => $letter->reference,
                'date' => now()->format('M d, Y'),
            ],
            is_array($recipient->placeholder_data) ? $recipient->placeholder_data : []
        );

        $header = $this->workflow->personalize($letter->header_html, $data);
        $body = $this->workflow->personalize($letter->body_html, $data);
        $footer = $this->workflow->personalize($letter->footer_html, $data);

        return view('letters.pdf', [
            'letter' => $letter,
            'recipient' => $recipient,
            'settings' => $settings,
            'header_html' => $header,
            'body_html' => $body,
            'footer_html' => $footer,
            'institution_name' => $institutionName,
        ])->render();
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
