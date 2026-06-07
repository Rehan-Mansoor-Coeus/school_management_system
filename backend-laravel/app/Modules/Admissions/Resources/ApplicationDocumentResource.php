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
