<?php

namespace App\Modules\Admissions\Requests;

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
            'document_names' => 'nullable|array|max:20',
            'document_names.*' => 'required_with:documents.*|string|max:255',
            'documents' => 'nullable|array|max:20',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:5120',
        ];
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
        ];
    }
}
