<?php

namespace App\Modules\Admissions\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'application_number' => $this->application_number,
            'status' => $this->status,
            'application_fee' => $this->application_fee,
            'application_fee_paid' => $this->application_fee_paid,
            'fee_paid_at' => $this->fee_paid_at?->format('Y-m-d H:i:s'),
            'admission_letter_sent' => $this->admission_letter_sent,
            'admission_accepted' => $this->admission_accepted,
            'rejection_reason' => $this->rejection_reason,
            'admission_comment' => $this->admission_comment,
            'applicant' => new ApplicantResource($this->whenLoaded('applicant')),
            'programme' => [
                'id' => $this->programme->id ?? null,
                'name' => $this->programme->name ?? null,
                'code' => $this->programme->code ?? null,
            ],
            'academic_year' => [
                'id' => $this->academicYear->id ?? null,
                'name' => $this->academicYear->name ?? null,
            ],
            'reviewed_at' => $this->reviewed_at?->format('Y-m-d H:i:s'),
            'approved_at' => $this->approved_at?->format('Y-m-d H:i:s'),
            'admitted_at' => $this->admitted_at?->format('Y-m-d H:i:s'),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
