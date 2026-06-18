<?php

namespace App\Modules\Admissions\Requests;

use App\AdmissionAgreement;
use App\ProgrammeRequiredDocument;
use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'applicant_id' => 'required|exists:applicants,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'programme_id' => 'required|exists:programmes,id',
            'passport_path' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'transcript_path' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'required_document_ids' => 'nullable|array',
            'required_document_ids.*' => 'integer|exists:programme_required_documents,id',
            'required_documents' => 'nullable|array',
            'required_documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
            'document_comments' => 'nullable|array',
            'document_comments.*' => 'nullable|string|max:1000',
            'document_names' => 'nullable|array|max:20',
            'document_names.*' => 'required_with:documents.*|string|max:255',
            'documents' => 'nullable|array|max:20',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
            'applicant_signature' => 'required|file|mimes:png,jpg,jpeg|max:2048',
            'accepted_agreement_ids' => 'nullable|array',
            'accepted_agreement_ids.*' => 'integer|exists:admission_agreements,id',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (! $this->filled('programme_id')) {
                return;
            }

            $requiredDocs = ProgrammeRequiredDocument::where('programme_id', $this->programme_id)
                ->where('is_required', true)
                ->get();

            $ids = $this->input('required_document_ids', []);
            $files = $this->file('required_documents', []);

            foreach ($requiredDocs as $doc) {
                $submitted = false;

                if (is_array($ids)) {
                    foreach ($ids as $index => $submittedId) {
                        if ((int) $submittedId === (int) $doc->id
                            && is_array($files)
                            && isset($files[$index])
                            && $files[$index]) {
                            $submitted = true;
                            break;
                        }
                    }
                }

                if (! $submitted) {
                    $validator->errors()->add(
                        'required_documents',
                        'The document "'.$doc->name.'" is required for this programme.'
                    );
                }
            }

            $programmeId = (int) $this->programme_id;
            $institutionId = optional(\App\Programme::find($programmeId))->institution_id;
            if (! $institutionId) {
                return;
            }

            $requiredAgreements = AdmissionAgreement::forProgramme($institutionId, $programmeId)
                ->where('is_required', true)
                ->get();

            if ($requiredAgreements->isEmpty()) {
                return;
            }

            $acceptedIds = array_map('intval', (array) $this->input('accepted_agreement_ids', []));

            foreach ($requiredAgreements as $agreement) {
                if (! in_array((int) $agreement->id, $acceptedIds, true)) {
                    $validator->errors()->add(
                        'accepted_agreement_ids',
                        'You must accept the agreement "'.$agreement->title.'" before submitting.'
                    );
                }
            }
        });
    }

    public function messages()
    {
        return [
            'applicant_id.required' => 'Applicant information is required.',
            'applicant_id.exists' => 'The selected applicant is invalid.',
            'academic_year_id.required' => 'Academic year is required.',
            'programme_id.required' => 'Programme is required.',
            'passport_path.mimes' => 'Passport must be a PDF, JPG, JPEG, or PNG file.',
            'transcript_path.mimes' => 'Transcript must be a PDF, JPG, JPEG, or PNG file.',
            'applicant_signature.required' => 'Applicant signature is required.',
            'applicant_signature.mimes' => 'Signature must be a PNG or JPG image.',
        ];
    }
}
