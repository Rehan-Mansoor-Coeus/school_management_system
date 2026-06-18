<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #222; line-height: 1.55; margin: 0; padding: 0; }
        .page { padding: 24px 36px; }
        .letterhead { text-align: center; margin-bottom: 18px; }
        .letterhead img { max-width: 100%; max-height: 90px; }
        .fallback-header { border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 18px; text-align: center; }
        .fallback-header .name { font-size: 17px; font-weight: bold; color: #1e3a5f; }
        .title { text-align: center; font-size: 16px; font-weight: bold; color: #1e3a5f; margin: 16px 0 20px; text-transform: uppercase; letter-spacing: 1px; }
        .meta { margin-bottom: 16px; }
        .meta p { margin: 4px 0; }
        .section { margin: 14px 0; }
        .section-title { font-weight: bold; color: #1e3a5f; margin-bottom: 4px; text-transform: uppercase; font-size: 11px; }
        .section-body { padding-left: 4px; }
        .clearance-grid { width: 100%; border-collapse: collapse; margin: 12px 0; }
        .clearance-grid td { border: 1px solid #cbd5e1; padding: 8px 10px; vertical-align: top; }
        .clearance-grid .label { width: 28%; font-weight: bold; background: #f8fafc; }
        .badge-yes { color: #047857; font-weight: bold; }
        .badge-no { color: #b91c1c; font-weight: bold; }
        .signature-block { margin-top: 36px; }
        .signature-block img { max-height: 56px; margin-bottom: 4px; }
        .footer-note { margin-top: 24px; font-size: 10px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
</head>
<body>
<div class="page">
    <div class="letterhead">
        @if(!empty($letterhead_path))
            <img src="{{ $letterhead_path }}" alt="Letterhead">
        @else
            <div class="fallback-header">
                @if(!empty($logo_path))
                    <img src="{{ $logo_path }}" alt="Logo" style="max-height:40px;margin-bottom:6px;">
                @endif
                <div class="name">{{ $institution->name }}</div>
                @if($institution->address)<div style="font-size:11px;">{{ $institution->address }}</div>@endif
            </div>
        @endif
    </div>

    <div class="title">{{ $labels['title'] }}</div>

    <div class="meta">
        <p><strong>{{ $labels['certificate_no'] }}:</strong> {{ $certificate->certificate_number }}</p>
        <p><strong>{{ $labels['date'] }}:</strong> {{ $issue_date }}</p>
        @if($certificate->purpose)
            <p><strong>{{ $labels['purpose'] }}:</strong> {{ $certificate->purpose }}</p>
        @endif
    </div>

    <div class="section">
        <div class="section-title">{{ $labels['student_details'] }}</div>
        <div class="section-body">
            <p><strong>{{ $labels['name'] }}:</strong> {{ $student_name }}</p>
            <p><strong>{{ $labels['registration'] }}:</strong> {{ $student->registration_number }}</p>
            @if($programme_name)<p><strong>{{ $labels['programme'] }}:</strong> {{ $programme_name }}</p>@endif
            @if($student->admission_date)<p><strong>{{ $labels['admission_date'] }}:</strong> {{ $student->admission_date->format('d F Y') }}</p>@endif
            @if($student->current_level)<p><strong>{{ $labels['level'] }}:</strong> {{ $student->current_level }}</p>@endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">{{ $labels['conduct_remarks'] }}</div>
        <div class="section-body">{!! nl2br(e($certificate->conduct_remarks)) !!}</div>
    </div>

    <div class="section">
        <div class="section-title">{{ $labels['academic_standing'] }}</div>
        <div class="section-body">
            <p><strong>{{ $certificate->academic_standing }}</strong></p>
            @if($certificate->academic_standing_notes)
                <p>{!! nl2br(e($certificate->academic_standing_notes)) !!}</p>
            @endif
        </div>
    </div>

    <table class="clearance-grid">
        <tr>
            <td class="label">{{ $labels['finance_clearance'] }}</td>
            <td>
                @if($certificate->finance_cleared)
                    <span class="badge-yes">{{ $labels['cleared'] }}</span>
                    @if($certificate->finance_clearance_notes)<br><small>{{ $certificate->finance_clearance_notes }}</small>@endif
                @else
                    <span class="badge-no">{{ $labels['not_cleared'] }}</span>
                @endif
            </td>
        </tr>
        <tr>
            <td class="label">{{ $labels['library_clearance'] }}</td>
            <td>
                @if($certificate->library_cleared)
                    <span class="badge-yes">{{ $labels['cleared'] }}</span>
                    @if($certificate->library_clearance_notes)<br><small>{{ $certificate->library_clearance_notes }}</small>@endif
                @else
                    <span class="badge-no">{{ $labels['not_cleared'] }}</span>
                @endif
            </td>
        </tr>
    </table>

    <div class="section">
        <p>{{ $labels['certify_text'] }}</p>
    </div>

    <div class="signature-block">
        @if(!empty($registrar_signature_path))
            <img src="{{ $registrar_signature_path }}" alt="Registrar signature">
        @endif
        <p><strong>{{ $certificate->registrar_name ?: $labels['registrar'] }}</strong></p>
        <p>{{ $labels['registrar_title'] }}</p>
        <p>{{ $institution->name }}</p>
    </div>

    <div class="footer-note">{{ $labels['footer'] }}</div>
</div>
</body>
</html>
