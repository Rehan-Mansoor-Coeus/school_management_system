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

class RejectionLetterService
{
    use TranslatesForUser;

    public function generateRejectionLetter(Application $application, string $stage): string
    {
        $application->load(['institution', 'applicant.user', 'programme', 'academicYear']);

        $user = optional($application->applicant)->user;
        $locale = $this->userLocale($user);
        $institution = $application->institution;
        $settings = LetterSetting::where('institution_id', $application->institution_id)->first();
        $stageLabel = $this->transForUser('admissions.rejection_stage_'.$stage, [], $user);

        $data = [
            'institution' => $institution,
            'application' => $application,
            'programme' => $application->programme,
            'current_date' => Carbon::now()->format('d F Y'),
            'stage_label' => $stageLabel,
            'rejection_reason' => $application->rejection_reason,
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
            'labels' => [
                'title' => $this->transForUser('admissions.rejection_letter_title', [], $user),
                'date' => $this->transForUser('admissions.letter_date', [], $user),
                'application_no' => $this->transForUser('admissions.letter_application_no', [], $user),
                'dear' => $this->transForUser('admissions.letter_dear', [
                    'name' => $application->applicant->first_name.' '.$application->applicant->last_name,
                ], $user),
                'body' => $this->transForUser('admissions.rejection_letter_body', [
                    'institution' => $institution->name,
                    'programme' => $application->programme->name,
                    'stage' => $stageLabel,
                ], $user),
                'reason_heading' => $this->transForUser('admissions.rejection_letter_reason', [], $user),
                'closing' => $this->transForUser('admissions.rejection_letter_closing', [], $user),
                'yours' => $this->transForUser('admissions.letter_yours', [], $user),
                'registrar' => $this->transForUser('admissions.letter_registrar', [], $user),
            ],
        ];

        $html = view('admissions.rejection', $data)->render();

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'Helvetica');
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4');
        $dompdf->render();

        $filename = 'admissions/rejection-letters/'.$application->application_number.'_'.$stage.'_'.$locale.'_'.time().'.pdf';
        Storage::disk('public')->put($filename, $dompdf->output());

        return $filename;
    }
}
