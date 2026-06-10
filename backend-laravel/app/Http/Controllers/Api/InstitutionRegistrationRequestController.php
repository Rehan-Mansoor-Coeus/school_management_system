<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\InstitutionRegistrationRequest;
use Illuminate\Http\Request;

class InstitutionRegistrationRequestController extends Controller
{
    protected function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        if (! $user || ! $user->hasAnyRole(['super-admin', 'system-super-admin', 'institution-admin', 'admin'])) {
            abort(403, 'Unauthorized.');
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $query = InstitutionRegistrationRequest::query()->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate((int) $request->get('per_page', 20)));
    }

    public function approve(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $record = InstitutionRegistrationRequest::findOrFail($id);
        $record->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'admin_notes' => $request->get('admin_notes'),
        ]);

        return response()->json(['message' => 'Request approved.', 'data' => $record]);
    }

    public function reject(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $record = InstitutionRegistrationRequest::findOrFail($id);
        $record->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'admin_notes' => $request->get('admin_notes'),
        ]);

        return response()->json(['message' => 'Request rejected.', 'data' => $record]);
    }
}
