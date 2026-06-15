<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class LetterController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except([]);
        $this->middleware('module_enabled:hr');
    }


    public function templates(Request $request)
    {
        $query = \App\Modules\Hr\Models\HrLetterTemplate::where('institution_id', $this->institutionId());
        if ($request->filled('letter_type')) {
            $query->where('letter_type', $request->get('letter_type'));
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('name')->get()]);
    }

    public function storeTemplate(Request $request)
    {
        $payload = $request->validate([
            'letter_type' => 'required|string|max:40',
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:500',
            'body' => 'required|string',
            'is_default' => 'nullable|boolean',
        ]);
        $payload['institution_id'] = $this->institutionId();
        $payload['is_active'] = true;
        $item = \App\Modules\Hr\Models\HrLetterTemplate::create($payload);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function updateTemplate(Request $request, $id)
    {
        $item = \App\Modules\Hr\Models\HrLetterTemplate::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->update($request->only(['letter_type','name','subject','body','is_default','is_active']));

        return response()->json(['success' => true, 'data' => $item->fresh()]);
    }

    public function deleteTemplate($id)
    {
        $item = \App\Modules\Hr\Models\HrLetterTemplate::where('institution_id', $this->institutionId())->findOrFail($id);
        $item->delete();

        return response()->json(['success' => true, 'data' => true]);
    }

    public function preview(Request $request)
    {
        $payload = $request->validate([
            'template_id' => 'nullable|integer',
            'staff_profile_id' => 'required|integer',
            'subject' => 'nullable|string',
            'body' => 'nullable|string',
        ]);

        $staff = \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $this->institutionId())->findOrFail($payload['staff_profile_id']);
        $subject = isset($payload['subject']) ? $payload['subject'] : '';
        $body = isset($payload['body']) ? $payload['body'] : '';

        if (! empty($payload['template_id']) && ($subject === '' || $body === '')) {
            $template = \App\Modules\Hr\Models\HrLetterTemplate::where('institution_id', $this->institutionId())->findOrFail($payload['template_id']);
            $subject = $subject ?: $template->subject;
            $body = $body ?: $template->body;
        }

        $name = trim((string) $staff->first_name . ' ' . $staff->last_name);
        $subject = str_replace(['{STAFF_NAME}', '{EMPLOYEE_NAME}'], [$name, $name], $subject);
        $body = str_replace(['{STAFF_NAME}', '{EMPLOYEE_NAME}'], [$name, $name], $body);

        return response()->json(['success' => true, 'data' => ['subject' => $subject, 'body' => $body, 'staff' => $staff]]);
    }

    public function send(Request $request, \App\Modules\Hr\Services\HrNotificationService $notifications)
    {
        $payload = $request->validate([
            'template_id' => 'nullable|integer',
            'staff_profile_id' => 'required|integer',
            'letter_type' => 'nullable|string|max:40',
            'subject' => 'nullable|string|max:500',
            'body' => 'nullable|string',
            'send_whatsapp' => 'nullable|boolean',
        ]);

        $staff = \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $this->institutionId())->findOrFail($payload['staff_profile_id']);

        $subject = isset($payload['subject']) ? $payload['subject'] : '';
        $body = isset($payload['body']) ? $payload['body'] : '';
        $letterType = isset($payload['letter_type']) ? $payload['letter_type'] : null;

        if (! empty($payload['template_id']) && ($subject === '' || $body === '' || ! $letterType)) {
            $template = \App\Modules\Hr\Models\HrLetterTemplate::where('institution_id', $this->institutionId())->findOrFail($payload['template_id']);
            $subject = $subject ?: $template->subject;
            $body = $body ?: $template->body;
            $letterType = $letterType ?: $template->letter_type;
        }

        if ($subject === '' || $body === '' || ! $letterType) {
            return response()->json(['success' => false, 'message' => 'subject, body and letter_type are required'], 422);
        }

        $name = trim((string) $staff->first_name . ' ' . $staff->last_name);
        $subject = str_replace(['{STAFF_NAME}', '{EMPLOYEE_NAME}'], [$name, $name], $subject);
        $body = str_replace(['{STAFF_NAME}', '{EMPLOYEE_NAME}'], [$name, $name], $body);

        $letter = \App\Modules\Hr\Models\HrLetter::create([
            'institution_id' => $this->institutionId(),
            'template_id' => isset($payload['template_id']) ? $payload['template_id'] : null,
            'staff_profile_id' => $staff->id,
            'letter_type' => $letterType,
            'subject' => $subject,
            'body' => $body,
            'reference_code' => 'HRL-' . strtoupper(substr(md5($name . '-' . microtime(true)), 0, 10)),
            'status' => 'draft',
            'created_by' => auth()->id(),
        ]);

        $sent = false;
        if (! array_key_exists('send_whatsapp', $payload) || $payload['send_whatsapp']) {
            $result = $notifications->sendToStaff($staff, $subject . "\n\n" . $body);
            $sent = ! empty($result['success']);
            if ($sent) {
                $letter->status = 'sent';
                $letter->sent_whatsapp_at = now();
                $letter->save();
            }
        }

        return response()->json(['success' => true, 'data' => ['letter' => $letter->fresh(), 'whatsapp_sent' => $sent]]);
    }

    public function history(Request $request)
    {
        $query = \App\Modules\Hr\Models\HrLetter::where('institution_id', $this->institutionId());
        if ($request->filled('letter_type')) {
            $query->where('letter_type', $request->get('letter_type'));
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('id', 'desc')->limit(100)->get()]);
    }

}
