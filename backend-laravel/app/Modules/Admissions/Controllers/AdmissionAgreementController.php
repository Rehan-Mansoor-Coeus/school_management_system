<?php

namespace App\Modules\Admissions\Controllers;

use App\AdmissionAgreement;
use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class AdmissionAgreementController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function institutionAgreement(Request $request)
    {
        if (! Schema::hasTable('admission_agreements')) {
            return response()->json(['success' => true, 'data' => null]);
        }

        $institutionId = $this->institutionId();

        $agreement = AdmissionAgreement::where('institution_id', $institutionId)
            ->whereNull('programme_id')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $agreement,
        ]);
    }

    public function updateInstitutionAgreement(Request $request)
    {
        if (! Schema::hasTable('admission_agreements')) {
            return response()->json(['success' => false, 'message' => 'Agreements are not available.'], 503);
        }

        $institutionId = $this->ensureInstitutionId($request);

        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string|max:50000',
            'is_required' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $content = trim((string) $request->input('content', ''));
        $existing = AdmissionAgreement::where('institution_id', $institutionId)
            ->whereNull('programme_id')
            ->first();

        if ($content === '') {
            if ($existing) {
                $existing->delete();
            }

            return response()->json(['success' => true, 'data' => null]);
        }

        $agreement = AdmissionAgreement::updateOrCreate(
            ['institution_id' => $institutionId, 'programme_id' => null],
            [
                'title' => trim((string) $request->input('title', 'Application Agreement')) ?: 'Application Agreement',
                'content' => $content,
                'is_required' => $request->filled('is_required') ? (bool) $request->is_required : true,
                'is_active' => $request->filled('is_active') ? (bool) $request->is_active : true,
            ]
        );

        return response()->json(['success' => true, 'data' => $agreement]);
    }

    protected function ensureInstitutionId(Request $request): int
    {
        $institutionId = $this->institutionId();
        if (! $institutionId) {
            abort(422, 'No institution assigned to current user.');
        }

        return (int) $institutionId;
    }
}
