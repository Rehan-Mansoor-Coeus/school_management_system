<?php

namespace App\Modules\Admissions\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewApplicationRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'decision' => 'required|in:approved,rejected',
            'admission_comment' => 'nullable|string|max:1000',
            'rejection_reason' => 'required_if:decision,rejected|nullable|string|max:1000',
        ];
    }
}
