<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 24px 32px 80px 32px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #222; line-height: 1.5; margin: 0; }
        .letterhead { text-align: center; margin-bottom: 16px; }
        .letterhead img { max-width: 100%; max-height: 90px; }
        .title { font-size: 18px; font-weight: bold; color: #1e3a5f; text-align: center; margin-bottom: 16px; }
        .meta { margin-bottom: 16px; }
        table.details { width: 100%; border-collapse: collapse; margin-top: 16px; }
        table.details th, table.details td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
        table.details th { background: #f5f5f5; }
        .footer-wrap {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #1e3a5f;
            padding-top: 8px;
            font-size: 10px;
            color: #555;
            text-align: center;
        }
        .codes { margin-top: 20px; text-align: center; }
        .codes img { display: inline-block; vertical-align: middle; margin: 0 12px; }
        .qr-img { width: 80px; height: 80px; }
        .barcode-img { height: 44px; }
    </style>
</head>
<body>
    <div class="letterhead">
        @if(!empty($letterhead_path))
            <img src="{{ $letterhead_path }}" alt="Letterhead">
        @elseif(!empty($logo_path))
            <img src="{{ $logo_path }}" alt="Logo" style="max-height: 60px;">
        @else
            <div style="font-size: 16px; font-weight: bold;">{{ $institution->name ?? 'Institution' }}</div>
        @endif
    </div>

    <div class="title">{{ $labels['title'] }}</div>

    <div class="meta">
        <p><strong>{{ $labels['invoice_no'] }}:</strong> {{ $payment->reference_number }}</p>
        <p><strong>{{ $labels['date'] }}:</strong> {{ $current_date }}</p>
        <p><strong>{{ $labels['application_no'] }}:</strong> {{ $application->application_number ?? '—' }}</p>
    </div>

    <p><strong>{{ $labels['bill_to'] }}</strong><br>
        {{ optional($applicant)->full_name ?? '—' }}<br>
        {{ optional($applicant)->email ?? '' }}
    </p>

    <table class="details">
        <thead>
            <tr>
                <th>{{ $labels['fee_type'] }}</th>
                <th>{{ $labels['amount'] }}</th>
                <th>{{ $labels['status'] }}</th>
                <th>{{ $labels['method'] }}</th>
                <th>{{ $labels['paid_at'] }}</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ ucfirst(str_replace('_', ' ', $payment->payment_type)) }}</td>
                <td>{{ number_format((float) $payment->amount, 2) }}</td>
                <td>{{ ucfirst($payment->status) }}</td>
                <td>{{ ucfirst(str_replace('_', ' ', $payment->payment_method ?? '—')) }}</td>
                <td>{{ optional($payment->paid_at)->format('d M Y H:i') ?? '—' }}</td>
            </tr>
        </tbody>
    </table>

    @if(!empty($programme))
        <p style="margin-top: 16px;"><strong>Programme:</strong> {{ $programme->name }}</p>
    @endif

    <div class="codes">
        @if(!empty($qr_code_url))
            <img src="{{ $qr_code_url }}" alt="QR" class="qr-img">
        @endif
        @if(!empty($barcode_url))
            <img src="{{ $barcode_url }}" alt="Barcode" class="barcode-img">
        @endif
    </div>

    <div class="footer-wrap">
        {{ $labels['footer'] }}
    </div>
</body>
</html>
