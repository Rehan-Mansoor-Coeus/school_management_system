<?php

namespace App\Modules\Contracts\Services;

use App\Institution;
use App\Modules\Contracts\Models\Contract;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;

class ContractPdfService
{
    public function generateExecutedPdf(Contract $contract): string
    {
        $contract->loadMissing(['signatories', 'approvals', 'template', 'documentType', 'documents']);
        $institution = Institution::find($contract->institution_id);

        $signatories = $contract->signatories->map(function ($s) {
            return [
                'label' => $s->label ?: ucfirst(str_replace('_', ' ', $s->role)),
                'name' => $s->name,
                'signed_at' => optional($s->signed_at)->format('M d, Y H:i'),
                'signature_data_uri' => $this->signatureDataUri($s->signature_path),
            ];
        })->all();

        $verifyUrl = rtrim(env('FRONTEND_URL', config('app.url')), '/').'/document-verify/'.$contract->verification_code;

        $html = view('contracts.executed_pdf', [
            'contract' => $contract,
            'institution' => $institution,
            'signatories' => $signatories,
            'signature_data_uri' => $this->signatureDataUri($contract->signature_path),
            'logo_data_uri' => $this->assetDataUri(optional($institution)->logo_path),
            'verify_url' => $verifyUrl,
            'qr_code_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data='.urlencode($verifyUrl),
        ])->render();

        $pdfBinary = $this->htmlToPdf($html);
        $path = 'contracts/executed/'.$contract->institution_id.'/'.$contract->reference_number.'_'.time().'.pdf';
        Storage::disk('public')->put($path, $pdfBinary);

        return $path;
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

    protected function signatureDataUri(?string $path): ?string
    {
        if (! $path || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $binary = Storage::disk('public')->get($path);

        return 'data:image/png;base64,'.base64_encode($binary);
    }

    protected function assetDataUri(?string $path): ?string
    {
        if (! $path || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $binary = Storage::disk('public')->get($path);
        $mime = Storage::disk('public')->mimeType($path) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode($binary);
    }
}
