<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; margin: 36px; }
        h1 { font-size: 18px; margin-bottom: 8px; }
        .meta { margin-bottom: 20px; font-size: 11px; color: #444; }
        .content p { margin: 0 0 10px; line-height: 1.6; }
        .footer { margin-top: 40px; font-size: 11px; color: #555; }
    </style>
</head>
<body>
    <div class="meta">
        @if(!empty($letter->reference))
            <div><strong>Ref:</strong> {{ $letter->reference }}</div>
        @endif
        <div>{{ now()->format('M d, Y') }}</div>
    </div>

    <div class="meta">
        <div>{{ $recipient->name }}</div>
        @if($recipient->address)<div>{{ $recipient->address }}</div>@endif
        @if($recipient->email)<div>{{ $recipient->email }}</div>@endif
    </div>

    <h1>{{ $letter->subject }}</h1>

    @if($header_html)
        <div class="content">{!! $header_html !!}</div>
    @endif

    <div class="content">{!! $body_html !!}</div>

    @if($footer_html)
        <div class="footer">{!! $footer_html !!}</div>
    @endif
</body>
</html>
