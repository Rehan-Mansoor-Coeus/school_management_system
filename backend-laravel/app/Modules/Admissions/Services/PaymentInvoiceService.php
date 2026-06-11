<?php

namespace App\Modules\Admissions\Services;

use App\Concerns\TranslatesForUser;
use App\LetterSetting;
use App\Modules\Admissions\Models\ApplicationPayment;
use App\Services\Letters\LetterAssetHelper;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;

class PaymentInvoiceService
{
    use TranslatesForUser;

    public function renderInvoicePdf(ApplicationPayment $payment): string
    {
        $payment->load(['application.applicant.user', 'application.programme', 'application.academicYear', 'institution']);

        $application = $payment->application;
        $user = optional(optional($application)->applicant)->user;
        $institution = $payment->institution ?: optional($application)->institution;
        $settings = $institution
            ? LetterSetting::where('institution_id', $institution->id)->first()
            : null;

        $verifyUrl = rtrim(config('app.url'), '/').'/admissions/applications/'.$application->id;
        $barcodeData = urlencode($payment->reference_number);
        $qrData = urlencode($verifyUrl);

        $data = [
            'payment' => $payment,
            'application' => $application,
            'institution' => $institution,
            'applicant' => optional($application)->applicant,
            'programme' => optional($application)->programme,
            'current_date' => Carbon::now()->format('d F Y'),
            'letterhead_path' => LetterAssetHelper::pdfDataUri(
                optional($settings)->letterhead_path ?: optional($institution)->letterhead
            ),
            'footer_path' => LetterAssetHelper::pdfDataUri(
                optional($institution)->footer ?: optional($institution)->official_stamp
            ),
            'logo_path' => LetterAssetHelper::pdfDataUri(
                optional($settings)->logo_path ?: optional($institution)->logo
            ),
            'qr_code_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data='.$qrData,
            'barcode_url' => 'https://barcode.tec-it.com/barcode.ashx?data='.$barcodeData.'&code=Code128&translate-esc=on&dpi=96',
            'labels' => [
                'title' => $this->transForUser('admissions.invoice_title', [], $user),
                'invoice_no' => $this->transForUser('admissions.invoice_number', [], $user),
                'date' => $this->transForUser('admissions.letter_date', [], $user),
                'application_no' => $this->transForUser('admissions.letter_application_no', [], $user),
                'bill_to' => $this->transForUser('admissions.invoice_bill_to', [], $user),
                'fee_type' => $this->transForUser('admissions.fee_type', [], $user),
                'amount' => $this->transForUser('admissions.amount', [], $user),
                'status' => $this->transForUser('admissions.status', [], $user),
                'method' => $this->transForUser('admissions.payment_method', [], $user),
                'paid_at' => $this->transForUser('admissions.paid_at', [], $user),
                'footer' => $this->transForUser('admissions.invoice_footer', [
                    'institution' => optional($institution)->name ?: '',
                ], $user),
            ],
        ];

        $html = view('admissions.invoice', $data)->render();

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'Helvetica');
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4');
        $dompdf->render();

        return $dompdf->output();
    }
}
