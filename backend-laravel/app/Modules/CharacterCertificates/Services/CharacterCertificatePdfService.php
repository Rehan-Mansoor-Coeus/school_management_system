<?php

namespace App\Modules\CharacterCertificates\Services;

use App\LetterSetting;
use App\Modules\CharacterCertificates\Models\CharacterCertificate;
use App\Services\Letters\LetterAssetHelper;
use App\User;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;

class CharacterCertificatePdfService
{
    public function generate(CharacterCertificate $certificate, ?User $registrar = null): string
    {
        $certificate->load(['institution', 'student.user', 'student.programme']);

        $institution = $certificate->institution;
        $student = $certificate->student;
        $settings = LetterSetting::where('institution_id', $certificate->institution_id)->first();

        $letterhead = LetterAssetHelper::pdfDataUri(
            optional($settings)->letterhead_path ?: $institution->letterhead
        );
        $logo = LetterAssetHelper::pdfDataUri(
            optional($settings)->logo_path ?: $institution->logo
        );
        $registrarSignature = LetterAssetHelper::pdfDataUri($institution->registrar_signature);

        $registrarName = $certificate->registrar_name
            ?: optional($registrar)->name
            ?: optional($certificate->registrar)->name
            ?: 'Registrar';

        $labels = [
            'title' => 'Character Certificate',
            'certificate_no' => 'Certificate No.',
            'date' => 'Date of Issue',
            'purpose' => 'Purpose',
            'student_details' => 'Student Details',
            'name' => 'Full Name',
            'registration' => 'Registration Number',
            'programme' => 'Programme',
            'admission_date' => 'Admission Date',
            'level' => 'Current Level',
            'conduct_remarks' => 'Conduct Remarks',
            'academic_standing' => 'Academic Standing',
            'finance_clearance' => 'Finance Clearance',
            'library_clearance' => 'Library Clearance',
            'cleared' => 'Cleared',
            'not_cleared' => 'Not Cleared',
            'certify_text' => 'This is to certify that the above-named student has demonstrated good character and moral conduct during their period of study at this institution, subject to the clearances noted above.',
            'registrar' => 'Registrar',
            'registrar_title' => optional($settings)->default_signer_title ?: 'Registrar',
            'footer' => 'This certificate is issued by '.$institution->name.' and is valid with official signature.',
        ];

        $html = view('character_certificates.certificate', [
            'certificate' => $certificate,
            'institution' => $institution,
            'student' => $student,
            'student_name' => optional($student->user)->name ?: 'Student',
            'programme_name' => optional($student->programme)->name,
            'issue_date' => Carbon::now()->format('d F Y'),
            'letterhead_path' => $letterhead,
            'logo_path' => $logo,
            'registrar_signature_path' => $registrarSignature,
            'labels' => $labels,
        ])->render();

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'Helvetica');
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'character-certificates/'.$certificate->institution_id.'/'.$certificate->certificate_number.'_'.time().'.pdf';
        Storage::disk('public')->put($filename, $dompdf->output());

        return $filename;
    }
}
