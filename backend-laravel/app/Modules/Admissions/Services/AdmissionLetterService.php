<?php

namespace App\Modules\Admissions\Services;

use App\Modules\Admissions\Concerns\TranslatesAdmissions;
use App\Modules\Admissions\Models\Application;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;

class AdmissionLetterService
{
    use TranslatesAdmissions;

    public function generateAdmissionLetter(Application $application)
    {
        $application->load(['institution', 'applicant.user', 'programme', 'academicYear']);

        $user = optional($application->applicant)->user;
        $locale = $this->admissionsLocale($user);
        $session = $application->academicYear
            ? $this->admissionsTrans('letter_session', ['year' => $application->academicYear->name], $user)
            : '';

        $data = [
            'institution' => $application->institution,
            'applicant' => $application->applicant,
            'application' => $application,
            'programme' => $application->programme,
            'current_date' => Carbon::now()->format('d F Y'),
            'labels' => [
                'title' => $this->admissionsTrans('letter_title', [], $user),
                'date' => $this->admissionsTrans('letter_date', [], $user),
                'application_no' => $this->admissionsTrans('letter_application_no', [], $user),
                'dear' => $this->admissionsTrans('letter_dear', ['name' => $application->applicant->first_name.' '.$application->applicant->last_name], $user),
                'body' => $this->admissionsTrans('letter_body', [
                    'institution' => $application->institution->name,
                    'programme' => $application->programme->name,
                    'session' => $session,
                ], $user),
                'conditions' => $this->admissionsTrans('letter_conditions', [], $user),
                'closing' => $this->admissionsTrans('letter_closing', [], $user),
                'yours' => $this->admissionsTrans('letter_yours', [], $user),
                'registrar' => $this->admissionsTrans('letter_registrar', [], $user),
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
