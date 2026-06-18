<?php

namespace App\Modules\Contracts\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Contracts\Concerns\ResolvesInstitution;
use App\Modules\Contracts\Models\ContractTemplate;
use App\Modules\Contracts\Services\ContractTemplateService;
use Illuminate\Http\Request;

class ContractTemplateController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(ContractTemplateService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $items = $this->service->list($this->institutionId(), $request->only(['category', 'recipient_type', 'archived']));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:80',
            'category' => 'nullable|string|max:80',
            'recipient_type' => 'nullable|string|max:40',
            'description' => 'nullable|string',
            'body_html' => 'required|string',
            'merge_fields' => 'nullable|array',
            'required_documents' => 'nullable|array',
            'signer_fields' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $template = $this->service->create($this->institutionId(), (int) auth()->id(), $data);

        return response()->json(['success' => true, 'data' => $template], 201);
    }

    public function show($id)
    {
        $template = ContractTemplate::where('institution_id', $this->institutionId())->findOrFail($id);

        return response()->json(['success' => true, 'data' => $template]);
    }

    public function update(Request $request, $id)
    {
        $template = ContractTemplate::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'nullable|string|max:80',
            'category' => 'nullable|string|max:80',
            'recipient_type' => 'nullable|string|max:40',
            'description' => 'nullable|string',
            'body_html' => 'sometimes|string',
            'merge_fields' => 'nullable|array',
            'required_documents' => 'nullable|array',
            'signer_fields' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $updated = $this->service->update($template, (int) auth()->id(), $data);

        return response()->json(['success' => true, 'data' => $updated]);
    }

    public function clone($id)
    {
        $template = ContractTemplate::where('institution_id', $this->institutionId())->findOrFail($id);
        $copy = $this->service->clone($template, (int) auth()->id());

        return response()->json(['success' => true, 'data' => $copy], 201);
    }

    public function archive($id)
    {
        $template = ContractTemplate::where('institution_id', $this->institutionId())->findOrFail($id);
        $archived = $this->service->archive($template, (int) auth()->id());

        return response()->json(['success' => true, 'data' => $archived]);
    }
}
