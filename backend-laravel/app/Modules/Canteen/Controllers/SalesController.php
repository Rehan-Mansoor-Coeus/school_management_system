<?php

namespace App\Modules\Canteen\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Modules\Canteen\Models\CanteenOrder;
use App\Modules\Canteen\Services\CanteenInvoiceService;
use App\Services\InstitutionPaymentConfigResolver;
use Illuminate\Http\Request;

class SalesController extends Controller
{
    use ResolvesInstitution;

    protected $invoiceService;

    public function __construct(CanteenInvoiceService $invoiceService)
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:canteen');
        $this->invoiceService = $invoiceService;
    }

    public function index(Request $request)
    {
        $institutionId = $this->institutionId();

        $query = CanteenOrder::with(['student.user', 'servedBy', 'payments'])
            ->where('institution_id', $institutionId)
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('registration_number', 'like', "%{$search}%")
                            ->orWhereHas('user', function ($uq) use ($search) {
                                $uq->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        return response()->json(['success' => true, 'data' => $query->paginate(20)]);
    }

    public function show($orderId)
    {
        $order = CanteenOrder::with(['items.meal', 'payments', 'student.user', 'student.programme', 'servedBy'])
            ->where('institution_id', $this->institutionId())
            ->findOrFail($orderId);

        return response()->json(['success' => true, 'data' => $order]);
    }

    public function invoice($orderId)
    {
        $order = CanteenOrder::where('institution_id', $this->institutionId())->findOrFail($orderId);

        if ($order->status !== 'completed') {
            return response()->json(['success' => false, 'message' => __('canteen.invoice_not_ready')], 422);
        }

        $this->invoiceService->assignInvoiceNumber($order);
        $pdf = $this->invoiceService->renderInvoicePdf($order->fresh(['items.meal', 'payments', 'student.user', 'institution']), request());
        $filename = 'canteen-invoice-'.($order->invoice_number ?: $order->order_number).'.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    public function receipt($orderId)
    {
        $order = CanteenOrder::where('institution_id', $this->institutionId())->findOrFail($orderId);

        if ($order->status !== 'completed') {
            return response()->json(['success' => false, 'message' => __('canteen.invoice_not_ready')], 422);
        }

        $order = $this->invoiceService->prepareOrder($order);
        $html = $this->invoiceService->renderReceiptHtml($order, request());

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    public function paymentMethods()
    {
        $institutionId = $this->institutionId();
        $stripe = (new InstitutionPaymentConfigResolver())->stripe($institutionId);
        $campay = (new InstitutionPaymentConfigResolver())->campay($institutionId);

        return response()->json([
            'success' => true,
            'data' => [
                'stripe' => [
                    'enabled' => (bool) ($stripe['enabled'] ?? false),
                    'publishable_key' => $stripe['public_key'] ?? null,
                    'currency' => strtolower($stripe['currency'] ?? 'usd'),
                ],
                'campay' => [
                    'enabled' => (bool) ($campay['enabled'] ?? false),
                    'currency' => $campay['currency'] ?? 'XAF',
                ],
            ],
        ]);
    }
}
