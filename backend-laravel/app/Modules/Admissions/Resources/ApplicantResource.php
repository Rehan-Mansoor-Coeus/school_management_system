<?php

namespace App\Modules\Admissions\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ApplicantResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'middle_name' => $this->middle_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth,
            'nationality' => $this->nationality,
            'id_number' => $this->id_number,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'is_international' => $this->is_international,
            'passport_path' => $this->passport_path,
            'transcript_path' => $this->transcript_path,
            'passport_url' => $this->passport_path && Storage::disk('public')->exists($this->passport_path)
                ? Storage::disk('public')->url($this->passport_path)
                : null,
            'transcript_url' => $this->transcript_path && Storage::disk('public')->exists($this->transcript_path)
                ? Storage::disk('public')->url($this->transcript_path)
                : null,
        ];
    }
}
