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
        .header-fallback { text-align: center; margin-bottom: 16px; }
        .title { font-size: 18px; font-weight: bold; color: #1e3a5f; text-align: center; margin-bottom: 16px; }
        .meta { margin-bottom: 16px; }
        table.details { width: 100%; border-collapse: collapse; margin-top: 16px; }
        table.details th, table.details td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
        table.details th { background: #f5f5f5; }
        .codes { margin-top: 20px; text-align: right; }
        .codes img { display: inline-block; vertical-align: middle; margin-left: 12px; }
        .qr-img { width: 80px; height: 80px; }
        .barcode-img { height: 44px; }
        .footer-image img { width: 100%; height: auto; max-height: 70px; display: block; }
        .footer-text {
            background: #1e3a5f;
            color: #fff;
            padding: 8px 30px;
            font-size: 10px;
            text-align: center;
        }
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
                    <div class="header-fallback"><img src="{{ $logo_path }}" alt="Logo" style="max-height: 60px;"></div>
                @else
                    <div class="header-fallback"><div style="font-size: 16px; font-weight: bold;">{{ $institution->name ?? 'Institution' }}</div></div>
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
                @if(!empty($barcode_url))
                    <img src="{{ $barcode_url }}" alt="Barcode" class="barcode-img">
                @endif
                @if(!empty($qr_code_url))
                    <img src="{{ $qr_code_url }}" alt="QR" class="qr-img">
                @endif
            </div>
        </div>

        <div class="page-footer-row">
            @if(!empty($footer_path))
                <div class="footer-image"><img src="{{ $footer_path }}" alt="Footer"></div>
            @else
                <div class="footer-text">{{ $labels['footer'] }}</div>
            @endif
        </div>
    </div>
</body>
</html>
