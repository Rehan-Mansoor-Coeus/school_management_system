<?php

namespace App\Modules\Canteen\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Modules\Canteen\Models\CanteenWallet;
use App\Modules\Canteen\Services\CanteenWalletService;
use App\Student;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    use ResolvesInstitution;

    protected $walletService;

    public function __construct(CanteenWalletService $walletService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:canteen');
        $this->walletService = $walletService;
    }

    public function index(Request $request)
    {
        $institutionId = $this->institutionId();
        $query = CanteenWallet::with(['student.user', 'student.programme'])
            ->where('institution_id', $institutionId)
            ->orderByDesc('id');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('wallet_number', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('registration_number', 'like', "%{$search}%")
                            ->orWhereHas('user', function ($uq) use ($search) {
                                $uq->where('name', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                            });
                    });
            });
        }

        return response()->json(['success' => true, 'data' => $query->paginate(20)]);
    }

    public function myWallet()
    {
        $student = $this->currentStudent();
        $wallet = $this->walletService->ensureWallet($this->institutionId(), $student->id);
        $wallet->load(['transactions' => function ($q) {
            $q->orderByDesc('id')->limit(20);
        }]);

        return response()->json([
            'success' => true,
            'data' => [
                'wallet' => $wallet,
                'student' => $student->load('user', 'programme'),
                'qr_payload' => $wallet->qrPayload(),
            ],
        ]);
    }

    public function topUp(Request $request, $walletId)
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
            'target' => 'nullable|in:wallet,deposit',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $wallet = CanteenWallet::where('institution_id', $this->institutionId())->findOrFail($walletId);

        if (array_key_exists('credit_limit', $data)) {
            $wallet->credit_limit = (float) $data['credit_limit'];
            $wallet->save();
        }

        $target = $data['target'] ?? 'wallet';
        $transaction = $target === 'deposit'
            ? $this->walletService->creditDeposit($wallet, (float) $data['amount'], 'deposit_topup', $data['notes'] ?? null)
            : $this->walletService->credit($wallet, (float) $data['amount'], 'wallet_topup', $data['notes'] ?? null);

        return response()->json([
            'success' => true,
            'message' => __('canteen.wallet_topped_up'),
            'data' => ['wallet' => $wallet->fresh(), 'transaction' => $transaction],
        ]);
    }

    public function ensureForStudent($studentId)
    {
        $student = Student::where('institution_id', $this->institutionId())->findOrFail($studentId);
        $wallet = $this->walletService->ensureWallet($this->institutionId(), $student->id);

        return response()->json(['success' => true, 'data' => $wallet->load('student.user')]);
    }

    protected function currentStudent(): Student
    {
        $student = Student::where('institution_id', $this->institutionId())
            ->where('user_id', auth()->id())
            ->first();

        if (! $student) {
            abort(403, __('canteen.not_a_student'));
        }

        return $student;
    }
}
