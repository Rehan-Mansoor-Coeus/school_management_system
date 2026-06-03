<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #222; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; }
        .title { font-size: 18px; font-weight: bold; color: #1e3a5f; margin-top: 8px; }
        .meta { margin: 20px 0; }
        .signature { margin-top: 40px; }
    </style>
</head>
<body>
    <div class="header">
        <div style="font-size: 16px; font-weight: bold;">{{ $institution->name ?? 'Institution' }}</div>
        @if(!empty($institution->address))
            <div>{{ $institution->address }}</div>
        @endif
        <div class="title">{{ $labels['title'] }}</div>
    </div>

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
        <p><strong>{{ $labels['registrar'] }}</strong><br>{{ $institution->name }}</p>
    </div>
</body>
</html>
