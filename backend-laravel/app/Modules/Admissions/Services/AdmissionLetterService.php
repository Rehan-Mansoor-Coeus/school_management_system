<?php

namespace App\Modules\Admissions\Services;

use App\Modules\Admissions\Models\Application;
use App\Models\Institution;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class AdmissionLetterService
{
    public function generateAdmissionLetter(Application $application)
    {
        $institution = $application->institution;
        $applicant = $application->applicant;
        $programme = $application->programme;

        // Prepare data for PDF
        $data = [
            'institution' => $institution,
            'applicant' => $applicant,
            'application' => $application,
            'programme' => $programme,
            'current_date' => Carbon::now()->format('d F Y'),
            'admission_date' => $application->admitted_at->format('d F Y'),
        ];

        // Generate PDF
        $pdf = Pdf::loadView('admissions.letter', $data)
            ->setOption('defaultFont', 'Helvetica')
            ->setOption('margin-top', 20)
            ->setOption('margin-left', 10)
            ->setOption('margin-right', 10)
            ->setOption('margin-bottom', 20);

        // Store PDF
        $filename = 'admissions/letters/' . $application->application_number . '_' . time() . '.pdf';
        Storage::disk('public')->put($filename, $pdf->output());

        return $filename;
    }

    public function getAdmissionLetterTemplate($institution, $applicant, $application, $programme)
    {
        return view('admissions.letter', [
            'institution' => $institution,
            'applicant' => $applicant,
            'application' => $application,
            'programme' => $programme,
            'current_date' => Carbon::now()->format('d F Y'),
        ])->render();
    }
}
