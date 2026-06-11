<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 24px 32px 90px 32px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #222; line-height: 1.6; margin: 0; }
        .letterhead { text-align: center; margin-bottom: 20px; }
        .letterhead img { max-width: 100%; max-height: 100px; }
        .logo-row { text-align: center; margin-bottom: 8px; }
        .logo-row img { max-height: 60px; }
        .title { font-size: 18px; font-weight: bold; color: #1e3a5f; margin-top: 8px; text-align: center; }
        .meta { margin: 20px 0; }
        .signature-block { margin-top: 36px; }
        .signature-block img { max-height: 70px; display: block; margin-bottom: 4px; }
        .footer-wrap {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 2px solid #1e3a5f;
            padding-top: 10px;
            font-size: 10px;
            color: #444;
        }
        .footer-inner { width: 100%; }
        .footer-contact { text-align: center; line-height: 1.4; margin-bottom: 8px; }
        .footer-codes { width: 100%; margin-top: 6px; }
        .footer-codes td { vertical-align: bottom; text-align: center; }
        .footer-codes img { display: inline-block; }
        .qr-img { width: 90px; height: 90px; }
        .barcode-img { height: 48px; max-width: 260px; }
        .code-label { font-size: 9px; color: #666; margin-top: 4px; }
    </style>
</head>
<body>
    <div class="letterhead">
        @if(!empty($letterhead_path))
            <img src="{{ $letterhead_path }}" alt="Letterhead">
        @else
            @if(!empty($logo_path))
                <div class="logo-row"><img src="{{ $logo_path }}" alt="Logo"></div>
            @endif
            <div style="font-size: 16px; font-weight: bold;">{{ $institution->name ?? 'Institution' }}</div>
            @if(!empty($institution->address))
                <div>{{ $institution->address }}</div>
            @endif
        @endif
    </div>

    <div class="title">{{ $labels['title'] }}</div>

    <div class="meta">
        <p><strong>{{ $labels['date'] }}:</strong> {{ $current_date }}</p>
        <p><strong>{{ $labels['application_no'] }}:</strong> {{ $application->application_number }}</p>
    </div>

    <p>{{ $labels['dear'] }}</p>
    <p>{{ $labels['body'] }}</p>
    <p>{{ $labels['conditions'] }}</p>
    <p>{{ $labels['closing'] }}</p>

    <div class="signature-block">
        <p>{{ $labels['yours'] }}</p>
        @if(!empty($registrar_signature_path))
            <img src="{{ $registrar_signature_path }}" alt="Registrar signature">
        @endif
        <p><strong>{{ $labels['registrar'] }}</strong><br>{{ $institution->name }}</p>
    </div>

    <div class="footer-wrap">
        <div class="footer-contact">
            <strong>{{ $institution->name ?? '' }}</strong><br>
            @if(!empty($institution->address)){{ $institution->address }}@if(!empty($institution->city)), {{ $institution->city }}@endif<br>@endif
            @if(!empty($institution->phone)){{ $labels['phone'] ?? 'Tel' }}: {{ $institution->phone }}@endif
            @if(!empty($institution->email)) &nbsp;|&nbsp; {{ $institution->email }}@endif
            @if(!empty($institution->website)) &nbsp;|&nbsp; {{ $institution->website }}@endif
        </div>
        <table class="footer-codes" cellpadding="0" cellspacing="0">
            <tr>
                <td style="width: 35%;">
                    @if(!empty($qr_code_url))
                        <img src="{{ $qr_code_url }}" alt="QR Code" class="qr-img"><br>
                        <span class="code-label">{{ $labels['scan_verify'] ?? 'Scan to verify' }}</span>
                    @endif
                </td>
                <td style="width: 65%;">
                    @if(!empty($barcode_url))
                        <img src="{{ $barcode_url }}" alt="Barcode" class="barcode-img"><br>
                        <span class="code-label">{{ $application->application_number }}</span>
                    @endif
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
