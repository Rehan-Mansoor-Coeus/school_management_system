<?php

namespace App\Modules\Admissions\Services;

use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
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
        $locale = $this->admissionsLocale($user);
        $session = $application->academicYear
            ? $this->transForUser('admissions.letter_session', ['year' => $application->academicYear->name], $user)
            : '';

        $data = [
            'institution' => $application->institution,
            'applicant' => $application->applicant,
            'application' => $application,
            'programme' => $application->programme,
            'current_date' => Carbon::now()->format('d F Y'),
            'labels' => [
                'title' => $this->transForUser('admissions.letter_title', [], $user),
                'date' => $this->transForUser('admissions.letter_date', [], $user),
                'application_no' => $this->transForUser('admissions.letter_application_no', [], $user),
                'dear' => $this->transForUser('admissions.letter_dear', ['name' => $application->applicant->first_name.' '.$application->applicant->last_name], $user),
                'body' => $this->transForUser('admissions.letter_body', [
                    'institution' => $application->institution->name,
                    'programme' => $application->programme->name,
                    'session' => $session,
                ], $user),
                'conditions' => $this->transForUser('admissions.letter_conditions', [], $user),
                'closing' => $this->transForUser('admissions.letter_closing', [], $user),
                'yours' => $this->transForUser('admissions.letter_yours', [], $user),
                'registrar' => $this->transForUser('admissions.letter_registrar', [], $user),
            ],
        ];

        $html = view('admissions.letter', $data)->render();

        $options = new Options();
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
