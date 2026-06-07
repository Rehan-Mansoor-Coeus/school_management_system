<?php

namespace App\Modules\Hostel\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hostel\Concerns\ResolvesInstitution;
use App\Modules\Hostel\Models\HostelPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:hostel');
    }

    public function index(Request $request)
    {
        $query = HostelPayment::where('institution_id', $this->institutionId())
            ->with(['student.user', 'allocation.room.hostel', 'recorder']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(['success' => true, 'data' => $query->latest()->paginate(20)]);
    }

    public function myPayments()
    {
        $student = $this->studentForUser();
        if (! $student) {
            return response()->json(['success' => false, 'message' => __('hostel.not_a_student')], 403);
        }

        $payments = HostelPayment::where('student_id', $student->id)
            ->with(['allocation.room.hostel'])
            ->latest()
            ->get();

        return response()->json(['success' => true, 'data' => $payments]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'allocation_id' => 'nullable|exists:hostel_allocations,id',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $payment = HostelPayment::create([
            'institution_id' => $this->institutionId(),
            'student_id' => $data['student_id'],
            'allocation_id' => $data['allocation_id'] ?? null,
            'reference' => 'HST-' . strtoupper(Str::random(10)),
            'amount' => $data['amount'],
            'amount_paid' => 0,
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(['success' => true, 'data' => $payment->load(['student.user'])], 201);
    }

    public function recordPayment(Request $request, $id)
    {
        $payment = HostelPayment::where('institution_id', $this->institutionId())->findOrFail($id);

        $data = $request->validate([
            'amount_paid' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank_transfer,mobile_money,card,other',
            'payment_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $newPaid = (float) $payment->amount_paid + (float) $data['amount_paid'];
        $status = 'partial';
        if ($newPaid >= (float) $payment->amount) {
            $newPaid = (float) $payment->amount;
            $status = 'paid';
        }

        $payment->update([
            'amount_paid' => $newPaid,
            'status' => $status,
            'payment_method' => $data['payment_method'],
            'payment_reference' => $data['payment_reference'] ?? $payment->payment_reference,
            'notes' => $data['notes'] ?? $payment->notes,
            'recorded_by' => auth()->id(),
            'paid_at' => $status === 'paid' ? now() : $payment->paid_at,
        ]);

        return response()->json(['success' => true, 'data' => $payment->fresh(['student.user', 'allocation'])]);
    }

    public function waive($id)
    {
        $payment = HostelPayment::where('institution_id', $this->institutionId())->findOrFail($id);

        $payment->update([
            'status' => 'waived',
            'amount_paid' => $payment->amount,
            'recorded_by' => auth()->id(),
            'paid_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $payment]);
    }
}
