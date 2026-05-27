<?php

namespace App\Modules\Admissions\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveApplicationRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:1000',
        ];
    }

    public function messages()
    {
        return [
            'rejection_reason.required_if' => 'Rejection reason is required when rejecting an application.',
        ];
    }
}
