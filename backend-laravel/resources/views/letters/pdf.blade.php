<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 0; size: A4 portrait; }
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 0; }
        .page {
            position: relative;
            width: 210mm;
            min-height: 297mm;
            display: flex;
            flex-direction: column;
        }
        .page-body { flex: 1 0 auto; }
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
        .header-fallback {
            background: #1e3a5f;
            color: #fff;
            padding: 16px 30px;
            text-align: center;
        }
        .approval-row {
            text-align: right;
            padding: 4px 38px 2px;
            min-height: 28px;
        }
        .approval-row img {
            display: inline-block;
            max-height: 26px;
            max-width: 72px;
            margin-left: 10px;
            vertical-align: bottom;
        }
        .body-wrap { padding: 14px 38px 12px; }
        .meta { margin-bottom: 12px; line-height: 1.5; }
        .subject {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            text-decoration: underline;
            margin: 14px 0;
        }
        .content p { margin: 0 0 8px; line-height: 1.55; }
        .closing-row {
            margin-top: 24px;
            width: 100%;
        }
        .closing-row table { width: 100%; border-collapse: collapse; }
        .closing-row td { vertical-align: bottom; }
        .signer-cell { width: 55%; }
        .codes-cell { width: 45%; text-align: right; }
        .signer-cell img { max-height: 44px; margin: 6px 0 4px; display: block; }
        .codes-cell img.barcode { height: 36px; display: block; margin-left: auto; }
        .codes-cell img.qr { height: 72px; display: block; margin: 4px 0 0 auto; }
        .footer-image img { width: 100%; height: auto; max-height: 70px; display: block; }
        .footer-text {
            background: #111827;
            color: #fff;
            padding: 8px 30px;
            font-size: 9px;
            text-align: center;
        }
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
                            <img src="{{ $logo_path }}" alt="Logo" style="max-height:36px;margin-bottom:4px;">
                        @endif
                        <div style="font-size:16px;font-weight:bold;">{{ $settings->company_name ?? $institution_name ?? 'Institution' }}</div>
                    </div>
                @endif
            </div>

            @if(!empty($editor_signature_path) || !empty($approver_signature_path))
                <div class="approval-row">
                    @if(!empty($editor_signature_path))
                        <img src="{{ $editor_signature_path }}" alt="Editor">
                    @endif
                    @if(!empty($approver_signature_path))
                        <img src="{{ $approver_signature_path }}" alt="Approver">
                    @endif
                </div>
            @endif

            <div class="body-wrap">
                <div class="meta">
                    @if(!empty($letter->reference))
                        <div><strong>Ref:</strong> {{ $letter->reference }}</div>
                    @endif
                    <div>{{ $letter_date ?? now()->format('M d, Y') }}</div>
                </div>

                <div class="meta">
                    <div>{{ $recipient->name }}</div>
                    @if($recipient->address)<div>{{ $recipient->address }}</div>@endif
                    <div style="margin-top:8px;">Dear: {{ $recipient->name }},</div>
                </div>

                <div class="subject">Subject: {{ $letter->subject }}</div>

                @if($header_html)
                    <div class="content">{!! $header_html !!}</div>
                @endif

                <div class="content">{!! $body_html !!}</div>

                @if($footer_html)
                    <div class="content">{!! $footer_html !!}</div>
                @endif

                <div class="closing-row">
                    <table>
                        <tr>
                            <td class="signer-cell">
                                <div>Sincerely,</div>
                                @if(!empty($signer_signature_path))
                                    <img src="{{ $signer_signature_path }}" alt="Signature">
                                @else
                                    <div style="height:32px;border-bottom:1px dashed #999;width:160px;margin:10px 0 6px;"></div>
                                @endif
                                <div><strong>{{ $signer_name ?? $letter->author_name }}</strong></div>
                                @if(!empty($signer_title))<div>{{ $signer_title }}</div>@endif
                                @if(!empty($settings->company_name))<div>{{ $settings->company_name }}</div>@endif
                            </td>
                            <td class="codes-cell">
                                @if(!empty($barcode_url))
                                    <img class="barcode" src="{{ $barcode_url }}" alt="Barcode">
                                @endif
                                @if(!empty($qr_code_url))
                                    <img class="qr" src="{{ $qr_code_url }}" alt="QR Code">
                                @endif
                            </td>
                        </tr>
                    </table>
                </div>

                @if(!empty($cc) && count($cc))
                    <div style="margin-top:12px;font-size:10px;"><strong>CC:</strong> {{ implode(', ', $cc) }}</div>
                @endif
            </div>
        </div>

        <div class="page-footer-row" style="margin-top: auto;">
            @if(!empty($footer_image_path))
                <div class="footer-image"><img src="{{ $footer_image_path }}" alt="Footer"></div>
            @elseif(!empty($settings->default_footer_text))
                <div class="footer-text">{!! nl2br(e($settings->default_footer_text)) !!}</div>
            @else
                <div class="footer-text">{{ $settings->company_name ?? $institution_name ?? 'Institution footer' }}</div>
            @endif
        </div>
    </div>
</body>
</html>
