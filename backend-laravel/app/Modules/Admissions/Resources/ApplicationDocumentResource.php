<?php

namespace App\Modules\Admissions\Resources;

use App\Support\StorageUrl;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationDocumentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'document_name' => $this->document_name,
            'comment' => $this->comment,
            'programme_required_document_id' => $this->programme_required_document_id,
            'is_required' => optional($this->programmeRequiredDocument)->is_required,
            'review_status' => $this->review_status ?: 'pending',
            'review_comment' => $this->review_comment,
            'reviewed_at' => optional($this->reviewed_at)->format('Y-m-d H:i:s'),
            'reviewed_by' => $this->reviewed_by,
            'reviewed_by_name' => optional($this->reviewedBy)->name,
            'file_path' => $this->file_path,
            'mime_type' => $this->mime_type,
            'file_size' => $this->file_size,
            'url' => $this->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($this->file_path)
                ? StorageUrl::public($this->file_path)
                : null,
            'created_at' => optional($this->created_at)->format('Y-m-d H:i:s'),
        ];
    }
}
