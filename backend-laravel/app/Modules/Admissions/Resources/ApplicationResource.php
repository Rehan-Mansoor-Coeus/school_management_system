<?php

namespace App\Modules\Admissions\Resources;

use App\Modules\Admissions\Services\ApplicationProgressService;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
{
    public function toArray($request)
    {
        $progressService = new ApplicationProgressService();

        return [
            'id' => $this->id,
            'application_number' => $this->application_number,
            'status' => $this->status,
            'application_fee' => (float) $this->application_fee,
            'application_fee_paid' => (bool) $this->application_fee_paid,
            'fee_paid_at' => optional($this->fee_paid_at)->format('Y-m-d H:i:s'),
            'tuition_fee' => (float) $this->tuition_fee,
            'tuition_fee_paid' => (bool) $this->tuition_fee_paid,
            'tuition_paid_at' => optional($this->tuition_paid_at)->format('Y-m-d H:i:s'),
            'admission_letter_sent' => (bool) $this->admission_letter_sent,
            'admission_accepted' => (bool) $this->admission_accepted,
            'rejection_reason' => $this->rejection_reason,
            'admission_comment' => $this->admission_comment,
            'department_review_comment' => $this->department_review_comment,
            'applicant' => new ApplicantResource($this->whenLoaded('applicant')),
            'programme' => $this->when(
                $this->relationLoaded('programme') && $this->programme,
                function () {
                    return [
                        'id' => $this->programme->id,
                        'name' => $this->programme->name,
                        'code' => $this->programme->code,
                        'department_id' => $this->programme->department_id,
                    ];
                }
            ),
            'academic_year' => $this->when(
                $this->relationLoaded('academicYear') && $this->academicYear,
                function () {
                    return [
                        'id' => $this->academicYear->id,
                        'name' => $this->academicYear->name,
                        'code' => $this->academicYear->code ?? null,
                    ];
                }
            ),
            'registry_reviewed_at' => optional($this->registry_reviewed_at)->format('Y-m-d H:i:s'),
            'department_reviewed_at' => optional($this->department_reviewed_at)->format('Y-m-d H:i:s'),
            'approved_at' => optional($this->approved_at)->format('Y-m-d H:i:s'),
            'admitted_at' => optional($this->admitted_at)->format('Y-m-d H:i:s'),
            'admission_accepted_at' => optional($this->admission_accepted_at)->format('Y-m-d H:i:s'),
            'tuition_verified_at' => optional($this->tuition_verified_at)->format('Y-m-d H:i:s'),
            'created_at' => optional($this->created_at)->format('Y-m-d H:i:s'),
            'application_fee_proof_pending' => (bool) $this->hasPendingApplicationFeeProof(),
            'tuition_fee_proof_pending' => (bool) $this->hasPendingTuitionProof(),
            'can_pay_application_fee' => (bool) $this->canPayApplicationFee(),
            'can_accept_admission' => (bool) $this->canAcceptAdmission(),
            'can_pay_tuition' => (bool) $this->canPayTuition(),
            'can_submit_tuition_proof' => (bool) $this->canSubmitTuitionProof(),
            'latest_application_fee_payment' => $this->when(
                $this->relationLoaded('latestApplicationFeePayment') && $this->latestApplicationFeePayment,
                function () {
                    return new ApplicationPaymentResource($this->latestApplicationFeePayment);
                }
            ),
            'latest_tuition_payment' => $this->when(
                $this->relationLoaded('latestTuitionPayment') && $this->latestTuitionPayment,
                function () {
                    return new ApplicationPaymentResource($this->latestTuitionPayment);
                }
            ),
            'documents' => ApplicationDocumentResource::collection(
                $this->whenLoaded('documents')
            ),
            'progress' => $progressService->forApplication($this->resource),
        ];
    }
}
