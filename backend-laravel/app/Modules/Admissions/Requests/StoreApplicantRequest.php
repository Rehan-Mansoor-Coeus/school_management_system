<?php

namespace App\Modules\Admissions\Requests;

use App\Modules\Admissions\Models\Applicant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicantRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'middle_name' => $this->filled('middle_name') ? $this->middle_name : null,
            'state' => $this->filled('state') ? $this->state : null,
            'id_number' => $this->filled('id_number') ? $this->id_number : null,
            'is_international' => filter_var($this->input('is_international', false), FILTER_VALIDATE_BOOLEAN),
        ]);
    }

    public function rules()
    {
        return self::rulesFor(
            Applicant::where('user_id', optional($this->user())->id)->value('id')
        );
    }

    public static function rulesFor($ignoreApplicantId = null)
    {
        $emailRule = Rule::unique('applicants', 'email');
        $idRule = Rule::unique('applicants', 'id_number');

        if ($ignoreApplicantId) {
            $emailRule->ignore($ignoreApplicantId);
            $idRule->ignore($ignoreApplicantId);
        }

        return [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'email' => ['required', 'email', 'max:255', $emailRule],
            'phone' => 'required|string|max:20',
            'gender' => 'required|in:male,female,other',
            'date_of_birth' => 'required|date|before:today',
            'nationality' => 'required|string|max:100',
            'id_number' => ['nullable', 'string', 'max:100', $idRule],
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'required|string|max:100',
            'is_international' => 'sometimes|boolean',
        ];
    }

    public function messages()
    {
        return [
            'email.unique' => __('admissions.validation_email_unique'),
            'id_number.unique' => __('admissions.validation_id_number_unique'),
            'date_of_birth.before' => __('admissions.validation_date_of_birth_before'),
        ];
    }
}
