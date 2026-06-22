<?php

namespace App\Modules\Admissions\Services;

use App\Concerns\TranslatesForUser;
use App\LetterSetting;
use App\Modules\Admissions\Models\Application;
use App\Services\Letters\LetterAssetHelper;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;

class AdmissionLetterService
{
    use TranslatesForUser;

    public function generateAdmissionLetter(Application $application)
    {
        $application->load(['institution', 'applicant.user', 'programme', 'academicYear']);

        $user = optional($application->applicant)->user;
        $locale = $this->userLocale($user);
        $session = $application->academicYear
            ? $this->transForUser('admissions.letter_session', ['year' => $application->academicYear->name], $user)
            : '';

        $institution = $application->institution;
        $settings = LetterSetting::where('institution_id', $application->institution_id)->first();

        $verifyUrl = rtrim(config('app.url'), '/').'/admissions/applications/'.$application->id;
        $barcodeData = urlencode($application->application_number);
        $qrData = urlencode($verifyUrl);

        $applicant = $application->applicant;
        $programmeName = optional($application->programme)->name ?: '—';
        $applicantFirst = optional($applicant)->first_name ?: optional($user)->name ?: 'Applicant';
        $applicantLast = optional($applicant)->last_name ?: '';

        $data = [
            'institution' => $institution,
            'applicant' => $applicant,
            'application' => $application,
            'programme' => $application->programme,
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
            'registrar_signature_path' => LetterAssetHelper::pdfDataUri(optional($institution)->registrar_signature),
            'qr_code_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data='.$qrData,
            'barcode_url' => 'https://barcode.tec-it.com/barcode.ashx?data='.$barcodeData.'&code=Code128&translate-esc=on&dpi=96',
            'labels' => [
                'title' => $this->transForUser('admissions.letter_title', [], $user),
                'date' => $this->transForUser('admissions.letter_date', [], $user),
                'application_no' => $this->transForUser('admissions.letter_application_no', [], $user),
                'dear' => $this->transForUser('admissions.letter_dear', ['name' => trim($applicantFirst.' '.$applicantLast)], $user),
                'body' => $this->transForUser('admissions.letter_body', [
                    'institution' => optional($institution)->name ?: 'Institution',
                    'programme' => $programmeName,
                    'session' => $session,
                ], $user),
                'conditions' => $this->transForUser('admissions.letter_conditions', [], $user),
                'closing' => $this->transForUser('admissions.letter_closing', [], $user),
                'yours' => $this->transForUser('admissions.letter_yours', [], $user),
                'registrar' => $this->transForUser('admissions.letter_registrar', [], $user),
                'phone' => $this->transForUser('admissions.letter_phone', [], $user),
                'scan_verify' => $this->transForUser('admissions.letter_scan_verify', [], $user),
            ],
        ];

        $html = view('admissions.letter', $data)->render();

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'Helvetica');
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4');
        $dompdf->render();

        $filename = 'admissions/letters/'.$application->application_number.'_'.$locale.'_'.time().'.pdf';
        Storage::disk('public')->put($filename, $dompdf->output());

        return $filename;
    }
}
