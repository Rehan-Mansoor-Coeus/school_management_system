<?php

namespace App\Modules\Canteen\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Modules\Canteen\Services\CanteenPosService;
use Illuminate\Http\Request;

class PosController extends Controller
{
    use ResolvesInstitution;

    protected $posService;

    public function __construct(CanteenPosService $posService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:canteen');
        $this->posService = $posService;
    }

    public function menu()
    {
        $data = $this->posService->menu($this->institutionId());

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function checkout(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'nullable|exists:students,id',
            'items' => 'required|array|min:1',
            'items.*.meal_id' => 'required|exists:canteen_meals,id',
            'items.*.quantity' => 'nullable|integer|min:1|max:20',
            'payment_method' => 'required|in:cash,stripe,campay,pay_later,credit,deposit',
            'campay_phone' => 'nullable|string|max:30',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $result = $this->posService->checkout($this->institutionId(), $data);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => ($result['completed'] ?? false)
                ? __('canteen.pos_order_completed')
                : __('canteen.pos_payment_pending'),
            'data' => $result,
        ], ($result['completed'] ?? false) ? 200 : 202);
    }

    public function confirmPayment(Request $request, int $orderId)
    {
        $data = $request->validate([
            'payment_intent_id' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
        ]);

        try {
            $result = $this->posService->confirmPayment($this->institutionId(), $orderId, $data);
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => __('canteen.pos_order_completed'),
            'data' => $result,
        ]);
    }
}
