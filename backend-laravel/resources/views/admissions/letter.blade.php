<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #222; line-height: 1.6; margin: 24px; }
        .letterhead { text-align: center; margin-bottom: 20px; }
        .letterhead img { max-width: 100%; max-height: 100px; }
        .logo-row { text-align: center; margin-bottom: 8px; }
        .logo-row img { max-height: 60px; }
        .title { font-size: 18px; font-weight: bold; color: #1e3a5f; margin-top: 8px; text-align: center; }
        .meta { margin: 20px 0; }
        .signature { margin-top: 40px; }
        .signature img { max-height: 70px; }
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

    <div class="signature">
        <p>{{ $labels['yours'] }}</p>
        @if(!empty($registrar_signature_path))
            <p><img src="{{ $registrar_signature_path }}" alt="Registrar signature"></p>
        @endif
        <p><strong>{{ $labels['registrar'] }}</strong><br>{{ $institution->name }}</p>
    </div>
</body>
</html>
