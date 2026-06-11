<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 24px 32px 70px 32px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #222; line-height: 1.6; margin: 0; }
        .letterhead { text-align: center; margin-bottom: 20px; }
        .letterhead img { max-width: 100%; max-height: 100px; }
        .logo-row { text-align: center; margin-bottom: 8px; }
        .logo-row img { max-height: 60px; }
        .title { font-size: 18px; font-weight: bold; color: #8b1a1a; margin-top: 8px; text-align: center; }
        .meta { margin: 20px 0; }
        .reason-box { border: 1px solid #ccc; padding: 12px; margin: 16px 0; background: #fafafa; }
        .signature-block { margin-top: 36px; }
        .signature-block img { max-height: 70px; display: block; margin-bottom: 4px; }
        .footer-wrap {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #ccc;
            padding-top: 8px;
            font-size: 10px;
            color: #444;
            text-align: center;
        }
        .footer-image img { max-width: 100%; max-height: 70px; }
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
        @endif
    </div>

    <div class="title">{{ $labels['title'] }}</div>

    <div class="meta">
        <p><strong>{{ $labels['date'] }}:</strong> {{ $current_date }}</p>
        <p><strong>{{ $labels['application_no'] }}:</strong> {{ $application->application_number }}</p>
    </div>

    <p>{{ $labels['dear'] }}</p>
    <p>{{ $labels['body'] }}</p>

    @if(!empty($rejection_reason))
        <div class="reason-box">
            <strong>{{ $labels['reason_heading'] }}</strong><br>
            {{ $rejection_reason }}
        </div>
    @endif

    <p>{{ $labels['closing'] }}</p>

    <div class="signature-block">
        <p>{{ $labels['yours'] }}</p>
        @if(!empty($registrar_signature_path))
            <img src="{{ $registrar_signature_path }}" alt="Registrar signature">
        @endif
        <p><strong>{{ $labels['registrar'] }}</strong><br>{{ $institution->name }}</p>
    </div>

    <div class="footer-wrap">
        @if(!empty($footer_path))
            <div class="footer-image">
                <img src="{{ $footer_path }}" alt="Footer">
            </div>
        @else
            <strong>{{ $institution->name ?? '' }}</strong>
            @if(!empty($institution->phone)) &nbsp;|&nbsp; {{ $institution->phone }}@endif
            @if(!empty($institution->email)) &nbsp;|&nbsp; {{ $institution->email }}@endif
        @endif
    </div>
</body>
</html>
