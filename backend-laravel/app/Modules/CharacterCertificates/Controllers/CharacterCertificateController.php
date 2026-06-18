<?php

namespace App\Modules\CharacterCertificates\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\CharacterCertificates\Concerns\ResolvesInstitution;
use App\Modules\CharacterCertificates\Models\CharacterCertificate;
use App\Modules\CharacterCertificates\Services\CharacterCertificatePdfService;
use App\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CharacterCertificateController extends Controller
{
    use ResolvesInstitution;

    protected $pdfService;

    public function __construct(CharacterCertificatePdfService $pdfService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:character_certificates');
        $this->pdfService = $pdfService;
    }

    public function index(Request $request)
    {
        $institutionId = $this->institutionId();
        $query = CharacterCertificate::with(['student.user', 'student.programme', 'registrar'])
            ->where('institution_id', $institutionId)
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('certificate_number', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('registration_number', 'like', "%{$search}%")
                            ->orWhereHas('user', function ($uq) use ($search) {
                                $uq->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        return response()->json(['success' => true, 'data' => $query->paginate(20)]);
    }

    public function myCertificates()
    {
        $student = Student::where('institution_id', $this->institutionId())
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $items = CharacterCertificate::with(['registrar'])
            ->where('institution_id', $this->institutionId())
            ->where('student_id', $student->id)
            ->orderByDesc('id')
            ->get();

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function referenceData()
    {
        $institutionId = $this->institutionId();
        $students = Student::with(['user', 'programme'])
            ->where('institution_id', $institutionId)
            ->where('is_active', true)
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'registration_number' => $student->registration_number,
                    'name' => optional($student->user)->name,
                    'programme' => optional($student->programme)->name,
                ];
            });

        return response()->json(['success' => true, 'data' => ['students' => $students]]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'purpose' => 'nullable|string|max:255',
            'conduct_remarks' => 'nullable|string',
            'academic_standing' => 'nullable|string|max:255',
            'academic_standing_notes' => 'nullable|string',
        ]);

        $institutionId = $this->institutionId();
        Student::where('institution_id', $institutionId)->findOrFail($data['student_id']);

        $certificate = CharacterCertificate::create([
            'institution_id' => $institutionId,
            'student_id' => $data['student_id'],
            'certificate_number' => $this->nextCertificateNumber($institutionId),
            'purpose' => $data['purpose'] ?? null,
            'conduct_remarks' => $data['conduct_remarks'] ?? null,
            'academic_standing' => $data['academic_standing'] ?? null,
            'academic_standing_notes' => $data['academic_standing_notes'] ?? null,
            'status' => 'draft',
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => __('character_certificates.created'),
            'data' => $certificate->load(['student.user', 'student.programme']),
        ], 201);
    }

    public function show($id)
    {
        $certificate = $this->findCertificate($id);
        $certificate->load(['student.user', 'student.programme', 'registrar', 'financeClearee', 'libraryClearee', 'creator']);

        return response()->json(['success' => true, 'data' => $certificate]);
    }

    public function update(Request $request, $id)
    {
        $certificate = $this->findCertificate($id);
        if ($certificate->status === 'issued') {
            return response()->json(['success' => false, 'message' => __('character_certificates.already_issued')], 422);
        }

        $data = $request->validate([
            'purpose' => 'nullable|string|max:255',
            'conduct_remarks' => 'nullable|string',
            'academic_standing' => 'nullable|string|max:255',
            'academic_standing_notes' => 'nullable|string',
        ]);

        $certificate->update($data);
        if ($certificate->finance_cleared && $certificate->library_cleared) {
            $certificate->update(['status' => 'pending']);
        }

        return response()->json([
            'success' => true,
            'message' => __('character_certificates.updated'),
            'data' => $certificate->fresh()->load(['student.user', 'student.programme']),
        ]);
    }

    public function financeClearance(Request $request, $id)
    {
        $certificate = $this->findCertificate($id);
        $data = $request->validate([
            'cleared' => 'required|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        $certificate->update([
            'finance_cleared' => $data['cleared'],
            'finance_clearance_notes' => $data['notes'] ?? null,
            'finance_cleared_at' => $data['cleared'] ? now() : null,
            'finance_cleared_by' => $data['cleared'] ? auth()->id() : null,
            'status' => $this->resolveStatusAfterClearance($certificate, 'finance', $data['cleared']),
        ]);

        return response()->json([
            'success' => true,
            'message' => __('character_certificates.finance_updated'),
            'data' => $certificate->fresh(),
        ]);
    }

    public function libraryClearance(Request $request, $id)
    {
        $certificate = $this->findCertificate($id);
        $data = $request->validate([
            'cleared' => 'required|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        $certificate->update([
            'library_cleared' => $data['cleared'],
            'library_clearance_notes' => $data['notes'] ?? null,
            'library_cleared_at' => $data['cleared'] ? now() : null,
            'library_cleared_by' => $data['cleared'] ? auth()->id() : null,
            'status' => $this->resolveStatusAfterClearance($certificate, 'library', $data['cleared']),
        ]);

        return response()->json([
            'success' => true,
            'message' => __('character_certificates.library_updated'),
            'data' => $certificate->fresh(),
        ]);
    }

    public function issue($id)
    {
        $certificate = $this->findCertificate($id);

        if (! $certificate->isReadyToIssue()) {
            return response()->json([
                'success' => false,
                'message' => __('character_certificates.not_ready'),
            ], 422);
        }

        $registrar = auth()->user();
        $pdfPath = $this->pdfService->generate($certificate, $registrar);

        $certificate->update([
            'status' => 'issued',
            'pdf_path' => $pdfPath,
            'issued_at' => now(),
            'registrar_user_id' => $registrar->id,
            'registrar_name' => $registrar->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => __('character_certificates.issued'),
            'data' => $certificate->fresh()->load(['student.user', 'student.programme']),
        ]);
    }

    public function downloadPdf($id)
    {
        $certificate = $this->findCertificate($id);
        $this->authorizeCertificatePdfAccess($certificate);

        if (! $certificate->pdf_path || ! Storage::disk('public')->exists($certificate->pdf_path)) {
            if (! $certificate->isReadyToIssue() && $certificate->status !== 'issued') {
                return response()->json(['success' => false, 'message' => __('character_certificates.pdf_not_available')], 404);
            }
            $pdfPath = $this->pdfService->generate($certificate, auth()->user());
            $certificate->update(['pdf_path' => $pdfPath]);
        }

        return response()->file(Storage::disk('public')->path($certificate->pdf_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$certificate->certificate_number.'.pdf"',
        ]);
    }

    public function void($id)
    {
        $certificate = $this->findCertificate($id);
        $certificate->update(['status' => 'void']);

        return response()->json(['success' => true, 'message' => __('character_certificates.voided')]);
    }

    protected function findCertificate($id): CharacterCertificate
    {
        return CharacterCertificate::where('institution_id', $this->institutionId())->findOrFail($id);
    }

    protected function userCanManageCertificates(): bool
    {
        $user = auth()->user();
        if (! $user) {
            return false;
        }

        return $user->can('character_certificates.manage')
            || $user->can('character_certificates.issue')
            || $user->can('character_certificates.finance_clear')
            || $user->can('character_certificates.library_clear');
    }

    protected function authorizeCertificatePdfAccess(CharacterCertificate $certificate): void
    {
        if ($this->userCanManageCertificates()) {
            return;
        }

        $student = Student::where('institution_id', $this->institutionId())
            ->where('user_id', auth()->id())
            ->first();

        if (
            $student
            && (int) $certificate->student_id === (int) $student->id
            && $certificate->status === 'issued'
        ) {
            return;
        }

        abort(403, __('character_certificates.unauthorized'));
    }

    protected function nextCertificateNumber(int $institutionId): string
    {
        $year = date('Y');
        $count = CharacterCertificate::where('institution_id', $institutionId)
            ->whereYear('created_at', $year)
            ->count() + 1;

        return sprintf('CC-%s-%06d', $year, $count);
    }

    protected function resolveStatusAfterClearance(CharacterCertificate $certificate, string $type, bool $cleared): string
    {
        if ($certificate->status === 'issued' || $certificate->status === 'void') {
            return $certificate->status;
        }

        $financeOk = $type === 'finance' ? $cleared : $certificate->finance_cleared;
        $libraryOk = $type === 'library' ? $cleared : $certificate->library_cleared;

        if ($financeOk && $libraryOk) {
            return 'pending';
        }

        return 'draft';
    }
}
