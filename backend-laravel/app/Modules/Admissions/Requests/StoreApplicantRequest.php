<?php

namespace App\Modules\Admissions\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicantRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'email' => 'required|email|unique:applicants,email',
            'phone' => 'required|string|max:20',
            'gender' => 'required|in:male,female,other',
            'date_of_birth' => 'required|date',
            'nationality' => 'required|string',
            'id_number' => 'nullable|unique:applicants,id_number',
            'address' => 'required|string',
            'city' => 'required|string',
            'state' => 'nullable|string',
            'country' => 'required|string',
            'is_international' => 'boolean',
        ];
    }
}
