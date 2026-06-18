<?php

namespace App\Modules\Admissions\Resources;

use App\Support\StorageUrl;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationPaymentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'reference_number' => $this->reference_number,
            'payment_type' => $this->payment_type,
            'payment_method' => $this->payment_method,
            'amount' => (float) $this->amount,
            'status' => $this->status,
            'description' => $this->description,
            'proof_path' => $this->proof_path,
            'proof_url' => $this->proof_path ? StorageUrl::public($this->proof_path) : null,
            'proof_notes' => $this->proof_notes,
            'review_notes' => $this->review_notes,
            'reviewed_at' => optional($this->reviewed_at)->format('Y-m-d H:i:s'),
            'paid_at' => optional($this->paid_at)->format('Y-m-d H:i:s'),
            'created_at' => optional($this->created_at)->format('Y-m-d H:i:s'),
            'application' => new ApplicationResource($this->whenLoaded('application')),
            'reviewer' => $this->when(
                $this->relationLoaded('reviewer') && $this->reviewer,
                function () {
                    return [
                        'id' => $this->reviewer->id,
                        'name' => $this->reviewer->name,
                    ];
                }
            ),
        ];
    }
}
