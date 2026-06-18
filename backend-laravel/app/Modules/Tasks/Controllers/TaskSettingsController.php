<?php

namespace App\Modules\Tasks\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Tasks\Concerns\ResolvesInstitution;
use App\Modules\Tasks\Models\TaskCategory;
use App\Modules\Tasks\Models\TaskMessageTemplate;
use Illuminate\Http\Request;

class TaskSettingsController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:tasks');
    }

    public function categories()
    {
        $rows = TaskCategory::where('institution_id', $this->institutionId())->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $row = TaskCategory::create([
            'institution_id' => $this->institutionId(),
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        return response()->json(['success' => true, 'data' => $row], 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $row = TaskCategory::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $row->update($data);

        return response()->json(['success' => true, 'data' => $row]);
    }

    public function destroyCategory($id)
    {
        $row = TaskCategory::where('institution_id', $this->institutionId())->findOrFail($id);
        $row->delete();

        return response()->json(['success' => true, 'data' => ['deleted' => true]]);
    }

    public function templates()
    {
        $rows = TaskMessageTemplate::where('institution_id', $this->institutionId())->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function storeTemplate(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'nullable|string|max:255',
            'body' => 'nullable|string',
        ]);

        $row = TaskMessageTemplate::create([
            'institution_id' => $this->institutionId(),
            'name' => $data['name'],
            'subject' => $data['subject'] ?? null,
            'body' => $data['body'] ?? null,
        ]);

        return response()->json(['success' => true, 'data' => $row], 201);
    }

    public function updateTemplate(Request $request, $id)
    {
        $row = TaskMessageTemplate::where('institution_id', $this->institutionId())->findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'subject' => 'nullable|string|max:255',
            'body' => 'nullable|string',
        ]);

        $row->update($data);

        return response()->json(['success' => true, 'data' => $row]);
    }

    public function destroyTemplate($id)
    {
        $row = TaskMessageTemplate::where('institution_id', $this->institutionId())->findOrFail($id);
        $row->delete();

        return response()->json(['success' => true, 'data' => ['deleted' => true]]);
    }
}
