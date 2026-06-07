<?php

namespace App\Http\Controllers\Api;

use App\Fee;
use App\Http\Controllers\Controller;
use App\ProgrammeSemester;
use App\Services\Fees\FeeStatusService;
use App\Student;
use App\StudentFeePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FeeController extends Controller
{
    protected function institutionId(Request $request): int
    {
        $id = optional($request->user())->institution_id;
        if (! $id) {
            abort(422, 'No institution assigned to current user.');
        }

        return (int) $id;
    }

    public function index(Request $request)
    {
        $institutionId = $this->institutionId($request);
        $statusService = new FeeStatusService();

        $query = Fee::with(['student.user', 'programme', 'programmeLevel', 'programmeSemester'])
            ->where('institution_id', $institutionId);

        if ($request->filled('programme_id')) {
            $query->where('programme_id', $request->programme_id);
        }
        if ($request->filled('programme_level_id')) {
            $query->where('programme_level_id', $request->programme_level_id);
        }
        if ($request->filled('programme_semester_id')) {
            $query->where('programme_semester_id', $request->programme_semester_id);
        }
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('search')) {
            $term = '%'.$request->search.'%';
            $query->where(function ($q) use ($term) {
                $q->where('invoice_number', 'like', $term)
                    ->orWhereHas('student', function ($studentQuery) use ($term) {
                        $studentQuery->where('registration_number', 'like', $term);
                    });
            });
        }

        $fees = $query->orderByDesc('created_at')->paginate(20);
        $fees->getCollection()->transform(function (Fee $fee) use ($statusService) {
            $fee->status = $statusService->calculate($fee);

            return $this->formatFee($fee);
        });

        if ($request->filled('payment_status')) {
            $filtered = $fees->getCollection()->filter(function ($fee) use ($request) {
                return $fee['payment_status'] === $request->payment_status;
            })->values();
            $fees->setCollection($filtered);
        }

        return response()->json($fees);
    }

    public function myFees(Request $request)
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->with(['programme.levels.semesters'])->first();
        if (! $student) {
            return response()->json(['data' => [], 'student' => null]);
        }

        $fees = Fee::with(['programme', 'programmeLevel', 'programmeSemester', 'payments'])
            ->where('student_id', $student->id)
            ->orderBy('due_date')
            ->get()
            ->map(function (Fee $fee) {
                $fee->status = (new FeeStatusService())->calculate($fee);

                return $this->formatFee($fee);
            });

        return response()->json([
            'student' => [
                'id' => $student->id,
                'registration_number' => $student->registration_number,
                'current_level' => $student->current_level,
                'programme' => $student->programme ? [
                    'id' => $student->programme->id,
                    'name' => $student->programme->name,
                    'code' => $student->programme->code,
                ] : null,
            ],
            'data' => $fees,
        ]);
    }

    public function recordPayment(Request $request, Fee $fee)
    {
        if ($fee->institution_id !== $this->institutionId($request)) {
            return response()->json(['message' => 'Fee not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'nullable|in:cash,bank_transfer,online,check,other',
            'description' => 'nullable|string|max:500',
            'receipt_number' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $amount = (float) $request->amount;
        if ($amount > (float) $fee->balance) {
            return response()->json(['message' => 'Payment amount exceeds outstanding balance.'], 422);
        }

        $payment = StudentFeePayment::create([
            'institution_id' => $fee->institution_id,
            'student_id' => $fee->student_id,
            'fee_id' => $fee->id,
            'reference_number' => 'SFP-'.date('YmdHis').'-'.Str::upper(Str::random(6)),
            'payment_type' => 'tuition',
            'payment_method' => $request->input('payment_method', 'bank_transfer'),
            'amount' => $amount,
            'status' => 'completed',
            'description' => $request->description,
            'receipt_number' => $request->receipt_number,
            'paid_at' => now(),
            'recorded_by' => $request->user()->id,
        ]);

        $fee->recalculateBalances();

        return response()->json([
            'message' => 'Payment recorded.',
            'payment' => $payment,
            'fee' => $this->formatFee($fee->fresh(['student', 'programme', 'programmeLevel', 'programmeSemester', 'payments'])),
        ]);
    }

    public function updateSemesterFee(Request $request, ProgrammeSemester $semester)
    {
        $programme = $semester->programme;
        if ($programme->institution_id !== $this->institutionId($request)) {
            return response()->json(['message' => 'Semester not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'total_semester_fee' => 'nullable|numeric|min:0',
            'expected_payment_date' => 'nullable|date',
            'latest_payment_date' => 'nullable|date|after_or_equal:expected_payment_date',
            'name' => 'nullable|string|max:255',
            'programme_level_id' => 'nullable|exists:programme_levels,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $semester->update($request->only([
            'total_semester_fee', 'expected_payment_date', 'latest_payment_date', 'name', 'programme_level_id',
        ]));

        return response()->json($semester->fresh(['level', 'programme']));
    }

    public function reports(Request $request)
    {
        $institutionId = $this->institutionId($request);
        $statusService = new FeeStatusService();

        $fees = Fee::where('institution_id', $institutionId)->get();
        $summary = [
            'paid' => 0,
            'pending' => 0,
            'partial' => 0,
            'due' => 0,
            'overdue' => 0,
            'total_outstanding' => 0,
            'total_collected' => 0,
        ];
        $byProgramme = [];
        $bySemester = [];

        foreach ($fees as $fee) {
            $status = $statusService->calculate($fee);
            if (isset($summary[$status])) {
                $summary[$status]++;
            }
            $summary['total_outstanding'] += (float) $fee->balance;
            $summary['total_collected'] += (float) $fee->amount_paid;

            $programmeKey = $fee->programme_id ?: 'unknown';
            $byProgramme[$programmeKey] = ($byProgramme[$programmeKey] ?? 0) + (float) $fee->balance;

            $semesterKey = $fee->programme_semester_id ?: ($fee->semester_name ?: 'unknown');
            $bySemester[$semesterKey] = ($bySemester[$semesterKey] ?? 0) + (float) $fee->balance;
        }

        return response()->json([
            'summary' => $summary,
            'outstanding_by_programme' => $byProgramme,
            'outstanding_by_semester' => $bySemester,
        ]);
    }

    public function paymentHistory(Request $request, Student $student)
    {
        if ($student->institution_id !== $this->institutionId($request)) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        $payments = StudentFeePayment::with('fee')
            ->where('student_id', $student->id)
            ->orderByDesc('paid_at')
            ->get();

        return response()->json(['data' => $payments]);
    }

    protected function formatFee(Fee $fee): array
    {
        $status = (new FeeStatusService())->calculate($fee);

        return [
            'id' => $fee->id,
            'invoice_number' => $fee->invoice_number,
            'semester_name' => $fee->semester_name ?: optional($fee->programmeSemester)->name,
            'total_amount' => (float) $fee->total_amount,
            'amount_paid' => (float) $fee->amount_paid,
            'balance' => (float) $fee->balance,
            'payment_status' => $status,
            'due_date' => optional($fee->due_date)->format('Y-m-d'),
            'latest_payment_date' => optional($fee->latest_payment_date)->format('Y-m-d'),
            'paid_date' => optional($fee->paid_date)->format('Y-m-d'),
            'programme' => $fee->programme ? ['id' => $fee->programme->id, 'name' => $fee->programme->name] : null,
            'level' => $fee->programmeLevel ? ['id' => $fee->programmeLevel->id, 'name' => $fee->programmeLevel->name, 'level_number' => $fee->programmeLevel->level_number] : null,
            'semester' => $fee->programmeSemester ? ['id' => $fee->programmeSemester->id, 'name' => $fee->programmeSemester->name] : null,
            'student' => $fee->student ? [
                'id' => $fee->student->id,
                'registration_number' => $fee->student->registration_number,
                'name' => optional($fee->student->user)->name,
            ] : null,
            'payments' => $fee->relationLoaded('payments') ? $fee->payments->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'payment_method' => $payment->payment_method,
                    'paid_at' => optional($payment->paid_at)->format('Y-m-d H:i:s'),
                    'receipt_number' => $payment->receipt_number,
                ];
            }) : [],
        ];
    }
}
