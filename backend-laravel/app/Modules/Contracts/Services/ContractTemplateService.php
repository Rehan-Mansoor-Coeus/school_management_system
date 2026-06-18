<?php

namespace App\Modules\Contracts\Services;

use App\Modules\Contracts\Models\ContractTemplate;
use Illuminate\Support\Str;

class ContractTemplateService
{
    public function list(int $institutionId, array $filters = [])
    {
        $query = ContractTemplate::query()->where('institution_id', $institutionId);

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }
        if (! empty($filters['recipient_type'])) {
            $query->where('recipient_type', $filters['recipient_type']);
        }
        if (isset($filters['archived'])) {
            $query->where('is_archived', filter_var($filters['archived'], FILTER_VALIDATE_BOOLEAN));
        } else {
            $query->where('is_archived', false);
        }

        return $query->orderBy('name')->get();
    }

    public function create(int $institutionId, int $userId, array $data): ContractTemplate
    {
        return ContractTemplate::create([
            'institution_id' => $institutionId,
            'name' => $data['name'],
            'code' => $data['code'] ?? Str::slug($data['name'], '_'),
            'category' => $data['category'] ?? 'general',
            'recipient_type' => $data['recipient_type'] ?? 'staff',
            'description' => $data['description'] ?? null,
            'body_html' => $data['body_html'],
            'merge_fields' => $data['merge_fields'] ?? $this->defaultMergeFields(),
            'required_documents' => $data['required_documents'] ?? [],
            'signer_fields' => $data['signer_fields'] ?? $this->defaultSignerFields(),
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $userId,
        ]);
    }

    public function update(ContractTemplate $template, int $userId, array $data): ContractTemplate
    {
        $template->fill([
            'name' => $data['name'] ?? $template->name,
            'code' => $data['code'] ?? $template->code,
            'category' => $data['category'] ?? $template->category,
            'recipient_type' => $data['recipient_type'] ?? $template->recipient_type,
            'description' => $data['description'] ?? $template->description,
            'body_html' => $data['body_html'] ?? $template->body_html,
            'merge_fields' => $data['merge_fields'] ?? $template->merge_fields,
            'required_documents' => $data['required_documents'] ?? $template->required_documents,
            'signer_fields' => $data['signer_fields'] ?? $template->signer_fields,
            'is_active' => $data['is_active'] ?? $template->is_active,
            'updated_by' => $userId,
        ]);
        $template->save();

        return $template->fresh();
    }

    public function clone(ContractTemplate $template, int $userId): ContractTemplate
    {
        $copy = $template->replicate(['is_archived']);
        $copy->name = $template->name.' (Copy)';
        $copy->code = $template->code.'_copy_'.Str::random(4);
        $copy->created_by = $userId;
        $copy->updated_by = null;
        $copy->save();

        return $copy;
    }

    public function archive(ContractTemplate $template, int $userId): ContractTemplate
    {
        $template->update(['is_archived' => true, 'is_active' => false, 'updated_by' => $userId]);

        return $template->fresh();
    }

    public function defaultMergeFields(): array
    {
        return [
            'full_name', 'employee_number', 'student_number', 'national_id', 'passport_number',
            'address', 'phone_number', 'email', 'position', 'department', 'faculty', 'programme',
            'job_title', 'contract_start_date', 'contract_end_date', 'fixed_salary', 'hourly_rate',
            'daily_rate', 'monthly_rate', 'tuition_amount', 'scholarship_amount', 'institution_name',
        ];
    }

    public function defaultSignerFields(): array
    {
        return [
            ['key' => 'national_id', 'label' => 'National ID Number', 'required' => true],
            ['key' => 'address', 'label' => 'Address', 'required' => true],
            ['key' => 'emergency_contact', 'label' => 'Emergency Contact', 'required' => false],
            ['key' => 'bank_account', 'label' => 'Bank Account Number', 'required' => false],
            ['key' => 'tax_number', 'label' => 'Tax Number', 'required' => false],
        ];
    }
}
