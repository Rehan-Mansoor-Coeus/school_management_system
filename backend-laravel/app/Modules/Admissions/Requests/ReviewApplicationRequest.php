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
            'admission_comment' => 'nullable|string|max:1000',
        ];
    }
}
