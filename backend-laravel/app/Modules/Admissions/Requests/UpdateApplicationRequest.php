<?php

namespace App\Modules\Admissions\Requests;

use App\AdmissionAgreement;
use App\Modules\Admissions\Models\Application;
use App\ProgrammeRequiredDocument;
use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
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
            'applicant_signature' => 'nullable|file|mimes:png,jpg,jpeg|max:2048',
            'accepted_agreement_ids' => 'nullable|array',
            'accepted_agreement_ids.*' => 'integer|exists:admission_agreements,id',
            'deleted_document_ids' => 'nullable|array',
            'deleted_document_ids.*' => 'integer|exists:application_documents,id',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (! $this->filled('programme_id')) {
                return;
            }

            $application = Application::with('documents')->find($this->route('applicationId'));
            $programmeChanged = $application
                && (int) $application->programme_id !== (int) $this->programme_id;
            $deletedIds = array_map('intval', (array) $this->input('deleted_document_ids', []));

            $requiredDocs = ProgrammeRequiredDocument::where('programme_id', $this->programme_id)
                ->where('is_required', true)
                ->get();

            if ($requiredDocs->isEmpty()) {
                return;
            }

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

                if (! $submitted && ! $programmeChanged && $application) {
                    $existing = $application->documents()
                        ->where('programme_required_document_id', $doc->id)
                        ->when(! empty($deletedIds), function ($query) use ($deletedIds) {
                            $query->whereNotIn('id', $deletedIds);
                        })
                        ->exists();
                    if ($existing) {
                        continue;
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
                        'You must accept the agreement "'.$agreement->title.'" before saving.'
                    );
                }
            }
        });
    }
}
