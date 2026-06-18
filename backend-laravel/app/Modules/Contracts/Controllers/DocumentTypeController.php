<?php

namespace App\Modules\Contracts\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Contracts\Concerns\ResolvesInstitution;
use App\Modules\Contracts\Models\DocumentType;
use App\Modules\Contracts\Services\DocumentTypeService;
use Illuminate\Http\Request;

class DocumentTypeController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(DocumentTypeService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $items = $this->service->list($this->institutionId(), $request->only(['category', 'active']));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show($id)
    {
        $type = DocumentType::with('defaultTemplate:id,name')->where('institution_id', $this->institutionId())->findOrFail($id);

        return response()->json(['success' => true, 'data' => $type]);
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);
        $type = $this->service->create($this->institutionId(), (int) auth()->id(), $data);

        return response()->json(['success' => true, 'data' => $type], 201);
    }

    public function update(Request $request, $id)
    {
        $type = DocumentType::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $this->validatePayload($request, false);
        $updated = $this->service->update($type, (int) auth()->id(), $data);

        return response()->json(['success' => true, 'data' => $updated]);
    }

    public function destroy($id)
    {
        $type = DocumentType::where('institution_id', $this->institutionId())->findOrFail($id);
        if ($type->is_system) {
            return response()->json(['success' => false, 'message' => 'System document types cannot be deleted. You may deactivate it instead.'], 422);
        }
        $this->service->delete($type);

        return response()->json(['success' => true, 'data' => ['deleted' => true]]);
    }

    protected function validatePayload(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'name' => ($creating ? 'required' : 'sometimes').'|string|max:255',
            'key' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:80',
            'recipient_type' => 'nullable|string|max:40',
            'default_template_id' => 'nullable|integer',
            'required_signatories' => 'nullable|array',
            'required_approvers' => 'nullable|array',
            'required_uploads' => 'nullable|array',
            'field_schema' => 'nullable|array',
            'expiry_rules' => 'nullable|array',
            'notification_rules' => 'nullable|array',
            'supports_expiry' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);
    }
}
