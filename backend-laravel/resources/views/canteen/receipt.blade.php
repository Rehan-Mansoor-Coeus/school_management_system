<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Receipt {{ $order->invoice_number ?? $order->order_number }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            color: #111;
            margin: 0;
            padding: 12px;
            background: #fff;
        }
        .receipt {
            max-width: 320px;
            margin: 0 auto;
        }
        .letterhead img {
            width: 100%;
            max-height: 100px;
            object-fit: contain;
            display: block;
            margin: 0 auto 8px;
        }
        .brand-fallback {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #ccc;
        }
        .brand-fallback img {
            max-height: 56px;
            max-width: 120px;
            object-fit: contain;
            margin-bottom: 6px;
        }
        .brand-fallback h1 {
            margin: 0;
            font-size: 16px;
            color: #1e3a5f;
        }
        .brand-fallback p {
            margin: 2px 0 0;
            font-size: 11px;
            color: #555;
        }
        .title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 8px 0 12px;
            text-transform: uppercase;
        }
        .meta, .customer {
            margin-bottom: 10px;
            line-height: 1.45;
        }
        table.items {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        table.items th, table.items td {
            padding: 4px 0;
            border-bottom: 1px dotted #ddd;
            text-align: left;
            vertical-align: top;
        }
        table.items th:last-child, table.items td:last-child {
            text-align: right;
        }
        .totals {
            border-top: 1px solid #111;
            padding-top: 8px;
            margin-top: 8px;
        }
        .totals .row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
        }
        .totals .grand {
            font-size: 14px;
            font-weight: bold;
            margin-top: 6px;
        }
        .payment {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px dashed #ccc;
            font-size: 11px;
        }
        .barcode {
            text-align: center;
            margin-top: 12px;
        }
        .barcode img {
            height: 40px;
        }
        .footer {
            margin-top: 12px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        .footer img {
            width: 100%;
            max-height: 48px;
            object-fit: contain;
            margin-bottom: 6px;
        }
        .no-print {
            text-align: center;
            margin: 12px 0;
        }
        .no-print button {
            background: #1e3a5f;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 13px;
            cursor: pointer;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            .receipt { max-width: none; width: 80mm; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="letterhead">
            @if(!empty($letterhead_url))
                <img src="{{ $letterhead_url }}" alt="Institution letterhead">
            @elseif(!empty($letterhead_path))
                <img src="{{ $letterhead_path }}" alt="Institution letterhead">
            @else
                <div class="brand-fallback">
                    @if(!empty($logo_url))
                        <img src="{{ $logo_url }}" alt="Logo">
                    @elseif(!empty($logo_path))
                        <img src="{{ $logo_path }}" alt="Logo">
                    @endif
                    <h1>{{ $institution->name ?? 'Institution' }}</h1>
                    @if(!empty($institution->address))
                        <p>{{ $institution->address }}@if(!empty($institution->city)), {{ $institution->city }}@endif</p>
                    @endif
                    @if(!empty($institution->phone))
                        <p>{{ $institution->phone }}</p>
                    @endif
                </div>
            @endif
        </div>

        <div class="title">Canteen Receipt</div>

        <div class="meta">
            <div><strong>Receipt:</strong> {{ $order->invoice_number ?? $order->order_number }}</div>
            <div><strong>Order:</strong> {{ $order->order_number }}</div>
            <div><strong>Date:</strong> {{ $current_date }}</div>
        </div>

        <div class="customer">
            <strong>Customer</strong><br>
            @if($student && $student->user)
                {{ $student->user->name }}<br>
                {{ $student->registration_number ?? '' }}
            @else
                Walk-in customer
            @endif
        </div>

        <table class="items">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                    <tr>
                        <td>{{ optional($item->meal)->name ?? 'Meal' }}</td>
                        <td>{{ $item->quantity }}</td>
                        <td>{{ number_format((float) $item->line_total, 2) }} {{ $currency }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <div class="row"><span>Subtotal</span><span>{{ number_format((float) $order->subtotal, 2) }} {{ $currency }}</span></div>
            @if((float) $order->subscription_credit > 0)
                <div class="row"><span>Plan credit</span><span>-{{ number_format((float) $order->subscription_credit, 2) }} {{ $currency }}</span></div>
            @endif
            <div class="row grand"><span>Total</span><span>{{ number_format((float) $order->total, 2) }} {{ $currency }}</span></div>
        </div>

        @if($payments->isNotEmpty())
            <div class="payment">
                @foreach($payments as $payment)
                    <div>Paid via {{ ucfirst(str_replace('_', ' ', $payment->method)) }}: {{ number_format((float) $payment->amount, 2) }} {{ $currency }}</div>
                @endforeach
            </div>
        @elseif(!empty($order->payment_method))
            <div class="payment">
                Payment: {{ ucfirst(str_replace('_', ' ', $order->payment_method)) }}
            </div>
        @endif

        @if(!empty($barcode_url))
            <div class="barcode">
                <img src="{{ $barcode_url }}" alt="Barcode">
            </div>
        @endif

        <div class="footer">
            @if(!empty($footer_url))
                <img src="{{ $footer_url }}" alt="Footer">
            @endif
            <div>Thank you — {{ $institution->name ?? 'Institution' }}</div>
        </div>
    </div>

    <div class="no-print">
        <button type="button" onclick="window.print()">Print receipt</button>
    </div>

    <script>
        window.addEventListener('load', function () {
            setTimeout(function () { window.print(); }, 300);
        });
    </script>
</body>
</html>
