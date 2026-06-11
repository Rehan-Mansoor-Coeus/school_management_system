<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 0; size: A4 portrait; }
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; font-size: 12px; color: #222; margin: 0; padding: 0; }
        .page { position: relative; width: 210mm; min-height: 297mm; display: flex; flex-direction: column; }
        .page-body { flex: 1 0 auto; padding: 0 32px; }
        .watermark {
            position: fixed;
            top: 42%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.07;
            z-index: 0;
            text-align: center;
        }
        .watermark img { max-width: 220px; max-height: 220px; }
        .content-layer { position: relative; z-index: 1; }
        .header-wrap img { width: 100%; height: auto; max-height: 100px; display: block; }
        .header-fallback { text-align: center; margin-bottom: 16px; }
        .header-fallback .logo-row img { max-height: 60px; margin-bottom: 8px; }
        .title { font-size: 18px; font-weight: bold; color: #1e3a5f; margin: 12px 0 16px; text-align: center; }
        .meta { margin: 16px 0; line-height: 1.6; }
        .signature-block { margin-top: 36px; }
        .signature-block img { max-height: 70px; display: block; margin-bottom: 4px; }
        .closing-row { margin-top: 24px; width: 100%; }
        .closing-row table { width: 100%; border-collapse: collapse; }
        .closing-row td { vertical-align: bottom; }
        .signer-cell { width: 55%; }
        .codes-cell { width: 45%; text-align: right; }
        .codes-cell img.barcode { height: 48px; display: block; margin-left: auto; }
        .codes-cell img.qr { height: 90px; display: block; margin: 4px 0 0 auto; }
        .code-label { font-size: 9px; color: #666; margin-top: 4px; }
        .footer-image img { width: 100%; height: auto; max-height: 70px; display: block; }
        .footer-text {
            background: #1e3a5f;
            color: #fff;
            padding: 8px 30px;
            font-size: 10px;
            text-align: center;
            line-height: 1.4;
        }
        .page-footer-row { margin-top: auto; }
    </style>
</head>
<body>
    @if(!empty($logo_path))
        <div class="watermark"><img src="{{ $logo_path }}" alt="Watermark"></div>
    @endif

    <div class="page content-layer">
        <div class="page-body">
            <div class="header-wrap">
                @if(!empty($letterhead_path))
                    <img src="{{ $letterhead_path }}" alt="Letterhead">
                @else
                    <div class="header-fallback">
                        @if(!empty($logo_path))
                            <div class="logo-row"><img src="{{ $logo_path }}" alt="Logo"></div>
                        @endif
                        <div style="font-size: 16px; font-weight: bold;">{{ $institution->name ?? 'Institution' }}</div>
                        @if(!empty($institution->address))
                            <div>{{ $institution->address }}</div>
                        @endif
                    </div>
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

            <div class="closing-row">
                <table>
                    <tr>
                        <td class="signer-cell">
                            <div class="signature-block">
                                <p>{{ $labels['yours'] }}</p>
                                @if(!empty($registrar_signature_path))
                                    <img src="{{ $registrar_signature_path }}" alt="Registrar signature">
                                @endif
                                <p><strong>{{ $labels['registrar'] }}</strong><br>{{ $institution->name }}</p>
                            </div>
                        </td>
                        <td class="codes-cell">
                            @if(!empty($barcode_url))
                                <img class="barcode" src="{{ $barcode_url }}" alt="Barcode"><br>
                                <span class="code-label">{{ $application->application_number }}</span>
                            @endif
                            @if(!empty($qr_code_url))
                                <img class="qr" src="{{ $qr_code_url }}" alt="QR Code"><br>
                                <span class="code-label">{{ $labels['scan_verify'] ?? 'Scan to verify' }}</span>
                            @endif
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="page-footer-row">
            @if(!empty($footer_path))
                <div class="footer-image"><img src="{{ $footer_path }}" alt="Footer"></div>
            @else
                <div class="footer-text">
                    <strong>{{ $institution->name ?? '' }}</strong><br>
                    @if(!empty($institution->address)){{ $institution->address }}@if(!empty($institution->city)), {{ $institution->city }}@endif<br>@endif
                    @if(!empty($institution->phone)){{ $labels['phone'] ?? 'Tel' }}: {{ $institution->phone }}@endif
                    @if(!empty($institution->email)) &nbsp;|&nbsp; {{ $institution->email }}@endif
                    @if(!empty($institution->website)) &nbsp;|&nbsp; {{ $institution->website }}@endif
                </div>
            @endif
        </div>
    </div>
</body>
</html>
