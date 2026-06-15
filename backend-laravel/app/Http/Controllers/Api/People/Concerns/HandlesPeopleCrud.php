<?php

namespace App\Http\Controllers\Api\People\Concerns;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Generic CRUD for standalone "people" entities that have their own table
 * (customers, billers, suppliers). Student/teacher/staff are NOT handled here —
 * they live in the `users` table and use HandlesUserPeopleCrud.
 */
trait HandlesPeopleCrud
{
    abstract protected function modelClass(): string;

    abstract protected function viewPermissions(): array;

    abstract protected function createPermissions(): array;

    abstract protected function editPermissions(): array;

    abstract protected function deletePermissions(): array;

    public function index(Request $request)
    {
        if (! $this->hasAnyPermission($request, $this->viewPermissions())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = $this->modelClass()::query()
            ->where('institution_id', $this->institutionId($request));

        if ($search = trim((string) $request->get('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('additional_phone_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('name')->paginate((int) $request->get('per_page', 20)));
    }

    public function store(Request $request)
    {
        if (! $this->hasAnyPermission($request, $this->createPermissions())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), $this->rules());
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $record = $this->modelClass()::create(array_merge(
            $this->preparePayload($validator->validated(), $request),
            ['institution_id' => $this->institutionId($request), 'status' => $request->get('status', 'active')]
        ));

        return response()->json(['message' => 'Record created.', 'data' => $record], 201);
    }

    public function update(Request $request, $id)
    {
        $record = $this->modelClass()::query()->find($id);
        if (! $record) {
            return response()->json(['message' => 'Record not found.'], 404);
        }
        if (! $this->canAccessInstitution($request, $record->institution_id)) {
            return response()->json(['message' => 'Record not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, $this->editPermissions())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), $this->rules(true));
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $record->update($this->preparePayload($validator->validated(), $request));

        return response()->json(['message' => 'Record updated.', 'data' => $record]);
    }

    public function destroy(Request $request, $id)
    {
        $record = $this->modelClass()::query()->find($id);
        if (! $record) {
            return response()->json(['message' => 'Record not found.'], 404);
        }
        if (! $this->canAccessInstitution($request, $record->institution_id)) {
            return response()->json(['message' => 'Record not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, $this->deletePermissions())) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $record->status = 'inactive';
        $record->save();

        return response()->json(['message' => 'Record deactivated.']);
    }

    protected function rules($updating = false): array
    {
        $rules = [
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone_number' => 'required|string|max:50',
            'additional_phone_number' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ];

        if ($this->supportsRoles()) {
            $rules['roles'] = 'nullable|array';
            $rules['roles.*'] = 'integer|exists:roles,id';
        }

        return $rules;
    }

    protected function supportsRoles(): bool
    {
        return false;
    }

    protected function preparePayload(array $data, Request $request): array
    {
        if (! isset($data['name']) || trim((string) $data['name']) === '') {
            $data['name'] = trim((string) ($data['email'] ?? $data['phone_number'] ?? 'User'));
        } else {
            $data['name'] = trim((string) $data['name']);
        }

        if ($this->supportsRoles()) {
            $data['role_ids'] = collect($request->get('roles', []))
                ->filter()
                ->map(function ($roleId) {
                    return (int) $roleId;
                })
                ->values()
                ->all();
            unset($data['roles']);
        }

        return $data;
    }
}
