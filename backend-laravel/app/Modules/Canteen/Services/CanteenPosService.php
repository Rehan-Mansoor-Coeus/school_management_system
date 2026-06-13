<?php

namespace App\Modules\Canteen\Services;

use App\Institution;
use App\Modules\Admissions\Services\CampayPaymentService;
use App\Modules\Admissions\Services\StripePaymentService;
use App\Services\InstitutionPaymentConfigResolver;
use App\Modules\Canteen\Models\CanteenMeal;
use App\Modules\Canteen\Models\CanteenMealAttendance;
use App\Modules\Canteen\Models\CanteenOrder;
use App\Modules\Canteen\Models\CanteenOrderItem;
use App\Modules\Canteen\Models\CanteenOrderPayment;
use App\Modules\Canteen\Models\CanteenSubscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CanteenPosService
{
    public const PAYMENT_METHODS = [
        'cash',
        'stripe',
        'campay',
        'pay_later',
        'credit',
        'deposit',
    ];

    protected $walletService;

    protected $verificationService;

    protected $invoiceService;

    public function __construct(
        CanteenWalletService $walletService,
        MealVerificationService $verificationService,
        CanteenInvoiceService $invoiceService
    ) {
        $this->walletService = $walletService;
        $this->verificationService = $verificationService;
        $this->invoiceService = $invoiceService;
    }

    public function menu(int $institutionId): array
    {
        $meals = CanteenMeal::where('institution_id', $institutionId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $grouped = [];
        foreach ($meals as $meal) {
            $type = $meal->meal_type ?: 'lunch';
            if (! isset($grouped[$type])) {
                $grouped[$type] = [];
            }
            $grouped[$type][] = $meal;
        }

        return [
            'meals' => $meals,
            'grouped' => $grouped,
            'payment_methods' => self::PAYMENT_METHODS,
        ];
    }

    public function checkout(int $institutionId, array $payload): array
    {
        $items = $payload['items'] ?? [];
        if (empty($items)) {
            throw new \RuntimeException(__('canteen.pos_empty_cart'));
        }

        $paymentMethod = $payload['payment_method'] ?? 'cash';
        if (! in_array($paymentMethod, self::PAYMENT_METHODS, true)) {
            throw new \RuntimeException(__('canteen.invalid_payment_method'));
        }

        $studentId = isset($payload['student_id']) ? (int) $payload['student_id'] : null;
        if (in_array($paymentMethod, ['deposit', 'credit', 'pay_later'], true) && ! $studentId) {
            throw new \RuntimeException(__('canteen.student_required_for_payment'));
        }

        return DB::transaction(function () use ($institutionId, $items, $paymentMethod, $studentId, $payload) {
            $order = CanteenOrder::create([
                'institution_id' => $institutionId,
                'student_id' => $studentId,
                'order_number' => $this->generateOrderNumber($institutionId),
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => $paymentMethod,
                'served_by' => optional(auth()->user())->id,
                'notes' => $payload['notes'] ?? null,
            ]);

            $subtotal = 0;
            $subscriptionCredit = 0;
            $orderItems = [];

            foreach ($items as $row) {
                $mealId = (int) ($row['meal_id'] ?? 0);
                $qty = max(1, (int) ($row['quantity'] ?? 1));
                $meal = CanteenMeal::where('institution_id', $institutionId)
                    ->where('id', $mealId)
                    ->where('is_active', true)
                    ->firstOrFail();

                for ($i = 0; $i < $qty; $i++) {
                    $unitPrice = (float) $meal->price;
                    $lineSub = $unitPrice;
                    $itemSubCredit = 0;
                    $paymentSource = 'paid';
                    $subscriptionId = null;

                    if ($studentId && $unitPrice > 0) {
                        $subscription = $this->findApplicableSubscription($institutionId, $studentId, $meal);
                        if ($subscription) {
                            $this->consumeSubscriptionMeal($subscription);
                            $itemSubCredit = $unitPrice;
                            $lineSub = 0;
                            $paymentSource = 'subscription';
                            $subscriptionId = $subscription->id;
                        }
                    } elseif ($unitPrice <= 0) {
                        $paymentSource = 'free';
                        $lineSub = 0;
                    }

                    $orderItem = CanteenOrderItem::create([
                        'order_id' => $order->id,
                        'meal_id' => $meal->id,
                        'quantity' => 1,
                        'unit_price' => $unitPrice,
                        'line_total' => $lineSub,
                        'subscription_credit' => $itemSubCredit,
                        'payment_source' => $paymentSource,
                        'subscription_id' => $subscriptionId,
                    ]);

                    $subtotal += $unitPrice;
                    $subscriptionCredit += $itemSubCredit;
                    $orderItems[] = $orderItem;
                }
            }

            $totalDue = round($subtotal - $subscriptionCredit, 2);

            $order->update([
                'subtotal' => round($subtotal, 2),
                'subscription_credit' => round($subscriptionCredit, 2),
                'total' => $totalDue,
            ]);

            $paymentResult = $this->processPayment(
                $order,
                $institutionId,
                $studentId,
                $paymentMethod,
                $totalDue,
                $payload
            );

            if ($paymentResult['completed']) {
                $this->finalizeOrder($order, $orderItems, $institutionId, $studentId, $paymentMethod);
            }

            $order = $order->fresh(['items.meal', 'payments', 'student.user']);

            return array_merge([
                'order' => $order,
                'invoice_number' => $order->invoice_number,
            ], $paymentResult);
        });
    }

    public function confirmPayment(int $institutionId, int $orderId, array $payload): array
    {
        $order = CanteenOrder::with('items.meal')
            ->where('institution_id', $institutionId)
            ->where('id', $orderId)
            ->firstOrFail();

        if ($order->payment_status === 'paid') {
            return ['order' => $order->load(['payments', 'student.user']), 'completed' => true];
        }

        return DB::transaction(function () use ($order, $institutionId, $payload) {
            $payment = $order->payments()->where('status', 'pending')->latest('id')->first();
            if (! $payment) {
                throw new \RuntimeException(__('canteen.no_pending_payment'));
            }

            if ($payment->method === 'stripe') {
                $intentId = $payload['payment_intent_id'] ?? $payment->gateway_reference;
                $stripe = StripePaymentService::forInstitution($institutionId);
                $intent = $stripe->retrievePaymentIntent($intentId);
                if (! $intent || ($intent['status'] ?? '') !== 'succeeded') {
                    throw new \RuntimeException(__('canteen.payment_not_confirmed'));
                }
                $payment->update([
                    'status' => 'completed',
                    'gateway_reference' => $intentId,
                    'paid_at' => now(),
                ]);
            } elseif ($payment->method === 'campay') {
                $reference = $payload['reference'] ?? $payment->gateway_reference;
                $campay = CampayPaymentService::forInstitution($institutionId);
                $status = $campay->getTransactionStatus($reference);
                if (! $status || ! in_array(strtoupper($status['status'] ?? ''), ['SUCCESSFUL', 'SUCCESS'], true)) {
                    throw new \RuntimeException(__('canteen.payment_not_confirmed'));
                }
                $payment->update([
                    'status' => 'completed',
                    'gateway_reference' => $reference,
                    'paid_at' => now(),
                ]);
            } else {
                throw new \RuntimeException(__('canteen.invalid_payment_method'));
            }

            $this->finalizeOrder(
                $order,
                $order->items,
                $institutionId,
                $order->student_id,
                $order->payment_method
            );

            $order = $order->fresh(['items.meal', 'payments', 'student.user']);

            return [
                'order' => $order,
                'completed' => true,
                'invoice_number' => $order->invoice_number,
            ];
        });
    }

    protected function processPayment(
        CanteenOrder $order,
        int $institutionId,
        ?int $studentId,
        string $method,
        float $amount,
        array $payload
    ): array {
        if ($amount <= 0) {
            $order->update(['payment_status' => 'paid']);
            return ['completed' => true, 'payment' => null];
        }

        $wallet = $studentId ? $this->walletService->ensureWallet($institutionId, $studentId) : null;
        $userId = optional(auth()->user())->id;

        switch ($method) {
            case 'cash':
                $payment = CanteenOrderPayment::create([
                    'order_id' => $order->id,
                    'institution_id' => $institutionId,
                    'method' => 'cash',
                    'amount' => $amount,
                    'status' => 'completed',
                    'reference' => 'CASH-'.$order->order_number,
                    'created_by' => $userId,
                    'paid_at' => now(),
                ]);
                $order->update(['payment_status' => 'paid']);

                return ['completed' => true, 'payment' => $payment];

            case 'deposit':
                $transaction = $this->walletService->debitDeposit(
                    $wallet,
                    $amount,
                    'pos_deposit',
                    __('canteen.pos_order_note', ['order' => $order->order_number])
                );
                $payment = CanteenOrderPayment::create([
                    'order_id' => $order->id,
                    'institution_id' => $institutionId,
                    'method' => 'deposit',
                    'amount' => $amount,
                    'status' => 'completed',
                    'wallet_transaction_id' => $transaction->id,
                    'reference' => $order->order_number,
                    'created_by' => $userId,
                    'paid_at' => now(),
                ]);
                $order->update(['payment_status' => 'paid']);

                return ['completed' => true, 'payment' => $payment];

            case 'credit':
                $transaction = $this->walletService->chargeCredit(
                    $wallet,
                    $amount,
                    'pos_credit',
                    __('canteen.pos_order_note', ['order' => $order->order_number])
                );
                $payment = CanteenOrderPayment::create([
                    'order_id' => $order->id,
                    'institution_id' => $institutionId,
                    'method' => 'credit',
                    'amount' => $amount,
                    'status' => 'completed',
                    'wallet_transaction_id' => $transaction->id,
                    'reference' => $order->order_number,
                    'created_by' => $userId,
                    'paid_at' => now(),
                ]);
                $order->update(['payment_status' => 'paid']);

                return ['completed' => true, 'payment' => $payment];

            case 'pay_later':
                $transaction = $this->walletService->recordPayLater(
                    $wallet,
                    $amount,
                    'pos_pay_later',
                    __('canteen.pos_order_note', ['order' => $order->order_number])
                );
                $payment = CanteenOrderPayment::create([
                    'order_id' => $order->id,
                    'institution_id' => $institutionId,
                    'method' => 'pay_later',
                    'amount' => $amount,
                    'status' => 'pending',
                    'wallet_transaction_id' => $transaction->id,
                    'reference' => $order->order_number,
                    'created_by' => $userId,
                ]);
                $order->update(['payment_status' => 'pending']);

                return ['completed' => true, 'payment' => $payment];

            case 'stripe':
                $stripeConfig = (new InstitutionPaymentConfigResolver())->stripe($institutionId);
                $currency = strtolower($stripeConfig['currency'] ?? config('services.stripe.currency', 'usd'));
                $stripe = StripePaymentService::forInstitution($institutionId);
                if (! $stripe->isConfigured()) {
                    throw new \RuntimeException(__('canteen.stripe_not_configured'));
                }
                $intent = $stripe->createPaymentIntent($amount, $currency, [
                    'canteen_order_id' => (string) $order->id,
                    'order_number' => $order->order_number,
                ]);
                if (! $intent) {
                    throw new \RuntimeException($stripe->lastError() ?: __('canteen.stripe_failed'));
                }
                $payment = CanteenOrderPayment::create([
                    'order_id' => $order->id,
                    'institution_id' => $institutionId,
                    'method' => 'stripe',
                    'amount' => $amount,
                    'status' => 'pending',
                    'gateway' => 'stripe',
                    'gateway_reference' => $intent['id'] ?? null,
                    'metadata' => ['client_secret' => $intent['client_secret'] ?? null],
                    'reference' => $order->order_number,
                    'created_by' => $userId,
                ]);

                return [
                    'completed' => false,
                    'payment' => $payment,
                    'stripe' => [
                        'public_key' => $stripe->publicKey(),
                        'client_secret' => $intent['client_secret'] ?? null,
                        'payment_intent_id' => $intent['id'] ?? null,
                        'currency' => $currency,
                    ],
                ];

            case 'campay':
                $phone = trim((string) ($payload['campay_phone'] ?? ''));
                if ($phone === '') {
                    throw new \RuntimeException(__('canteen.campay_phone_required'));
                }
                $institution = Institution::find($institutionId);
                $campay = CampayPaymentService::forInstitution($institutionId);
                if (! $campay->isConfigured()) {
                    throw new \RuntimeException(__('canteen.campay_not_configured'));
                }
                $reference = 'CANTEEN-'.$order->order_number.'-'.Str::upper(Str::random(4));
                $result = $campay->initiateCollect([
                    'amount' => $amount,
                    'currency' => $institution->currency ?? 'XAF',
                    'from' => $phone,
                    'description' => 'Canteen order '.$order->order_number,
                    'external_reference' => $reference,
                ]);
                if (! $result) {
                    throw new \RuntimeException(__('canteen.campay_failed'));
                }
                $payment = CanteenOrderPayment::create([
                    'order_id' => $order->id,
                    'institution_id' => $institutionId,
                    'method' => 'campay',
                    'amount' => $amount,
                    'status' => 'pending',
                    'gateway' => 'campay',
                    'gateway_reference' => $result['reference'] ?? $reference,
                    'metadata' => $result,
                    'reference' => $reference,
                    'created_by' => $userId,
                ]);

                return [
                    'completed' => false,
                    'payment' => $payment,
                    'campay' => [
                        'reference' => $result['reference'] ?? $reference,
                        'status' => $result['status'] ?? 'PENDING',
                    ],
                ];
        }

        throw new \RuntimeException(__('canteen.invalid_payment_method'));
    }

    protected function finalizeOrder(
        CanteenOrder $order,
        $orderItems,
        int $institutionId,
        ?int $studentId,
        string $paymentMethod
    ): void {
        foreach ($orderItems as $item) {
            if (! $studentId) {
                continue;
            }

            $attendancePaymentSource = $item->payment_source === 'subscription'
                ? 'subscription'
                : ($item->line_total <= 0 ? 'free' : 'wallet');

            CanteenMealAttendance::create([
                'institution_id' => $institutionId,
                'student_id' => $studentId,
                'meal_id' => $item->meal_id,
                'subscription_id' => $item->subscription_id,
                'order_id' => $order->id,
                'served_at' => now(),
                'verification_method' => 'wallet',
                'verified_by' => optional(auth()->user())->id,
                'amount_charged' => (float) $item->line_total,
                'payment_source' => $attendancePaymentSource,
                'pos_payment_method' => $paymentMethod,
                'status' => 'served',
                'notes' => __('canteen.pos_order_note', ['order' => $order->order_number]),
            ]);
        }

        $order->update([
            'status' => 'completed',
            'payment_status' => $order->payment_method === 'pay_later' ? 'pending' : 'paid',
            'completed_at' => now(),
        ]);

        $this->invoiceService->assignInvoiceNumber($order->fresh());
    }

    protected function findApplicableSubscription(int $institutionId, int $studentId, CanteenMeal $meal): ?CanteenSubscription
    {
        $reflection = new \ReflectionClass($this->verificationService);
        $method = $reflection->getMethod('findApplicableSubscription');
        $method->setAccessible(true);

        return $method->invoke($this->verificationService, $institutionId, $studentId, $meal);
    }

    protected function consumeSubscriptionMeal(CanteenSubscription $subscription): void
    {
        $subscription->meals_remaining -= 1;
        $subscription->meals_used += 1;
        if ($subscription->meals_remaining <= 0) {
            $subscription->status = 'expired';
        }
        $subscription->save();
    }

    protected function generateOrderNumber(int $institutionId): string
    {
        do {
            $number = sprintf('POS-%d-%s-%s', $institutionId, now()->format('Ymd'), strtoupper(Str::random(5)));
        } while (CanteenOrder::where('order_number', $number)->exists());

        return $number;
    }
}
