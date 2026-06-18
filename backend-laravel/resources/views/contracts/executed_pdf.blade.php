<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; }
        .logo { max-height: 60px; margin-bottom: 8px; }
        h1 { font-size: 18px; color: #1e3a5f; margin: 0; }
        .meta { font-size: 11px; color: #555; margin-top: 6px; }
        .body { line-height: 1.6; }
        .signatures { margin-top: 36px; }
        .sig-cell { display: inline-block; width: 46%; vertical-align: top; margin: 0 1% 16px; border-top: 1px solid #ccc; padding-top: 8px; }
        .signature-img { max-height: 70px; }
        .approvals { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 12px; }
        .uploads { margin-top: 20px; font-size: 11px; color: #444; }
        .verify { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 12px; }
        .verify table { width: 100%; }
        .footer { margin-top: 20px; font-size: 10px; color: #777; text-align: center; }
        .muted { color: #777; }
    </style>
</head>
<body>
    <div class="header">
        @if($logo_data_uri)
            <img src="{{ $logo_data_uri }}" class="logo" alt="Logo">
        @endif
        <h1>{{ $contract->title }}</h1>
        <div class="meta">
            Reference: {{ $contract->reference_number }} |
            {{ optional($institution)->name }}
            @if($contract->documentType) | {{ $contract->documentType->name }} @endif
        </div>
    </div>

    <div class="body">
        {!! $contract->body_html !!}
    </div>

    <div class="signatures">
        <strong>Signatures</strong><br><br>
        @foreach($signatories as $sig)
            <div class="sig-cell">
                <div><strong>{{ $sig['label'] }}:</strong> {{ $sig['name'] }}</div>
                @if($sig['signature_data_uri'])
                    <img src="{{ $sig['signature_data_uri'] }}" class="signature-img" alt="Signature">
                @else
                    <div class="muted">[ not signed ]</div>
                @endif
                <div class="muted">{{ $sig['signed_at'] ?: '—' }}</div>
            </div>
        @endforeach
    </div>

    @if($contract->approvals && count($contract->approvals))
        <div class="approvals">
            <strong>Approvals</strong>
            @foreach($contract->approvals as $approval)
                <div>
                    {{ $approval->approver_role ?: 'Approver' }} (Step {{ $approval->step_order }}):
                    <strong>{{ ucfirst($approval->status) }}</strong>
                    @if($approval->acted_at) — {{ $approval->acted_at->format('M d, Y H:i') }} @endif
                    @if($approval->approver_id) by User #{{ $approval->approver_id }} @endif
                </div>
            @endforeach
        </div>
    @endif

    @if($contract->documents && count($contract->documents))
        <div class="uploads">
            <strong>Uploaded Documents</strong>
            <ul>
                @foreach($contract->documents as $doc)
                    <li>{{ $doc->label ?: $doc->document_type }} ({{ $doc->mime_type }})</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="verify">
        <table>
            <tr>
                <td style="width: 70%; vertical-align: top;">
                    <strong>Verification Code:</strong> {{ $contract->verification_code }}<br>
                    <span class="muted">Verify authenticity at:</span><br>
                    <span class="muted">{{ $verify_url }}</span><br>
                    Executed on {{ optional($contract->executed_at)->format('M d, Y') ?? now()->format('M d, Y') }}
                </td>
                <td style="width: 30%; text-align: right;">
                    <img src="{{ $qr_code_url }}" alt="QR" style="width: 100px; height: 100px;">
                </td>
            </tr>
        </table>
    </div>

    <div class="footer">
        This document was generated and signed digitally via the institution Document Workflow system.
    </div>
</body>
</html>
