<?php

namespace App\Modules\Admissions\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Admissions\Concerns\ResolvesInstitution;
use App\Concerns\TranslatesForUser;
use App\Modules\Admissions\Models\Application;
use App\Modules\Admissions\Models\ApplicationDocument;
use App\Modules\Admissions\Resources\ApplicationDocumentResource;
use Illuminate\Http\Request;

class DocumentReviewController extends Controller
{
    use ResolvesInstitution, TranslatesForUser;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('role:registry|registrar|institution-admin|admin|super-admin');
    }

    public function review(Request $request, $documentId)
    {
        $document = ApplicationDocument::with(['application', 'programmeRequiredDocument'])->findOrFail($documentId);

        if ((int) $document->application->institution_id !== (int) $this->institutionId()) {
            abort(403, $this->transForUser('admissions.unauthorized'));
        }

        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'review_comment' => 'nullable|string|max:1000',
        ]);

        if ($validated['decision'] === 'rejected' && empty(trim((string) ($validated['review_comment'] ?? '')))) {
            return response()->json([
                'success' => false,
                'message' => $this->transForUser('admissions.document_review_comment_required'),
                'errors' => [
                    'review_comment' => [$this->transForUser('admissions.document_review_comment_required')],
                ],
            ], 422);
        }

        $document->update([
            'review_status' => $validated['decision'],
            'review_comment' => trim((string) ($validated['review_comment'] ?? '')) ?: null,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $validated['decision'] === 'approved'
                ? $this->transForUser('admissions.document_approved')
                : $this->transForUser('admissions.document_rejected'),
            'data' => new ApplicationDocumentResource($document->fresh('programmeRequiredDocument', 'reviewedBy')),
        ]);
    }
}
