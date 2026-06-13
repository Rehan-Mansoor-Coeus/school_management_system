<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 0; size: A4 portrait; }
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; font-size: 12px; color: #222; line-height: 1.5; margin: 0; padding: 0; }
        .page { position: relative; width: 210mm; min-height: 297mm; display: flex; flex-direction: column; }
        .page-body { flex: 1 0 auto; padding: 0 32px; }
        .header-wrap img { width: 100%; height: auto; max-height: 90px; display: block; }
        .header-fallback { text-align: center; margin-bottom: 16px; font-size: 16px; font-weight: bold; }
        .title { font-size: 18px; font-weight: bold; color: #1e3a5f; text-align: center; margin-bottom: 16px; }
        table.details { width: 100%; border-collapse: collapse; margin-top: 16px; }
        table.details th, table.details td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
        table.details th { background: #f5f5f5; }
        .totals { margin-top: 12px; text-align: right; }
        .codes { margin-top: 20px; text-align: right; }
        .footer-text { background: #1e3a5f; color: #fff; padding: 8px 30px; font-size: 10px; text-align: center; }
        .page-footer-row { margin-top: auto; }
    </style>
</head>
<body>
    <div class="page">
        <div class="page-body">
            <div class="header-wrap">
                @if(!empty($letterhead_path))
                    <img src="{{ $letterhead_path }}" alt="Letterhead">
                @elseif(!empty($logo_path))
                    <div class="header-fallback">
                        <img src="{{ $logo_path }}" alt="Logo" style="max-height: 70px; margin-bottom: 8px;">
                        <div>{{ $institution->name ?? 'Institution' }}</div>
                        @if(!empty($institution->address))
                            <div style="font-size: 11px; font-weight: normal; margin-top: 4px;">{{ $institution->address }}@if(!empty($institution->city)), {{ $institution->city }}@endif</div>
                        @endif
                    </div>
                @else
                    <div class="header-fallback">{{ $institution->name ?? 'Institution' }}</div>
                @endif
            </div>

            <div class="title">CANTEEN SALES INVOICE</div>

            <p><strong>Invoice No:</strong> {{ $order->invoice_number ?? $order->order_number }}</p>
            <p><strong>Order No:</strong> {{ $order->order_number }}</p>
            <p><strong>Date:</strong> {{ $current_date }}</p>
            <p><strong>Payment status:</strong> {{ ucfirst($order->payment_status) }}</p>

            <p><strong>Bill to</strong><br>
                @if($student && $student->user)
                    {{ $student->user->name }}<br>
                    {{ $student->registration_number ?? '' }}<br>
                    {{ $student->user->email ?? '' }}
                @else
                    Walk-in customer
                @endif
            </p>

            <table class="details">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit price</th>
                        <th>Line total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $item)
                        <tr>
                            <td>{{ optional($item->meal)->name ?? 'Meal' }}</td>
                            <td>{{ $item->quantity }}</td>
                            <td>{{ number_format((float) $item->unit_price, 2) }} {{ $currency }}</td>
                            <td>{{ number_format((float) $item->line_total, 2) }} {{ $currency }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="totals">
                <p><strong>Subtotal:</strong> {{ number_format((float) $order->subtotal, 2) }} {{ $currency }}</p>
                @if((float) $order->subscription_credit > 0)
                    <p><strong>Feeding plan credit:</strong> -{{ number_format((float) $order->subscription_credit, 2) }} {{ $currency }}</p>
                @endif
                <p><strong>Total:</strong> {{ number_format((float) $order->total, 2) }} {{ $currency }}</p>
            </div>

            @if($payments->isNotEmpty())
                <table class="details" style="margin-top: 20px;">
                    <thead>
                        <tr>
                            <th>Payment method</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Paid at</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($payments as $payment)
                            <tr>
                                <td>{{ ucfirst(str_replace('_', ' ', $payment->method)) }}</td>
                                <td>{{ number_format((float) $payment->amount, 2) }} {{ $currency }}</td>
                                <td>{{ ucfirst($payment->status) }}</td>
                                <td>{{ optional($payment->paid_at)->format('d M Y H:i') ?? '—' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif

            @if(!empty($barcode_url))
                <div class="codes">
                    <img src="{{ $barcode_url }}" alt="Barcode" style="height: 44px;">
                </div>
            @endif
        </div>

        <div class="page-footer-row">
            @if(!empty($footer_path))
                <img src="{{ $footer_path }}" alt="Footer" style="width: 100%; max-height: 70px;">
            @else
                <div class="footer-text">Computer-generated canteen invoice from {{ $institution->name ?? 'Institution' }}.</div>
            @endif
        </div>
    </div>
</body>
</html>
