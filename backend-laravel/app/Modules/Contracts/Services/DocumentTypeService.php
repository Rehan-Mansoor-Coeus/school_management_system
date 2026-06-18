<?php

namespace App\Modules\Contracts\Services;

use App\Modules\Contracts\Models\DocumentType;
use Illuminate\Support\Str;

class DocumentTypeService
{
    public function list(int $institutionId, array $filters = [])
    {
        $query = DocumentType::query()->with('defaultTemplate:id,name')->where('institution_id', $institutionId);

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }
        if (isset($filters['active'])) {
            $query->where('is_active', filter_var($filters['active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->orderBy('name')->get();
    }

    public function create(int $institutionId, int $userId, array $data): DocumentType
    {
        return DocumentType::create([
            'institution_id' => $institutionId,
            'key' => $data['key'] ?? Str::slug($data['name'], '_'),
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'] ?? 'general',
            'recipient_type' => $data['recipient_type'] ?? 'staff',
            'default_template_id' => $data['default_template_id'] ?? null,
            'required_signatories' => $data['required_signatories'] ?? [],
            'required_approvers' => $data['required_approvers'] ?? [],
            'required_uploads' => $data['required_uploads'] ?? [],
            'field_schema' => $data['field_schema'] ?? [],
            'expiry_rules' => $data['expiry_rules'] ?? [],
            'notification_rules' => $data['notification_rules'] ?? ['channels' => ['email', 'internal']],
            'supports_expiry' => $data['supports_expiry'] ?? false,
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $userId,
        ]);
    }

    public function update(DocumentType $type, int $userId, array $data): DocumentType
    {
        $type->fill(array_merge(
            array_intersect_key($data, array_flip([
                'name', 'description', 'category', 'recipient_type', 'default_template_id',
                'required_signatories', 'required_approvers', 'required_uploads', 'field_schema',
                'expiry_rules', 'notification_rules', 'supports_expiry', 'is_active',
            ])),
            ['updated_by' => $userId]
        ));
        $type->save();

        return $type->fresh('defaultTemplate');
    }

    public function delete(DocumentType $type): void
    {
        $type->delete();
    }
}
