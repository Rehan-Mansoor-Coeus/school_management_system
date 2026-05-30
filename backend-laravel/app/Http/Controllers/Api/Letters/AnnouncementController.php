<?php

namespace App\Http\Controllers\Api\Letters;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\Announcement;
use App\AnnouncementAttachment;
use App\AnnouncementLog;
use App\AnnouncementRecipient;
use App\AnnouncementSchedule;
use App\Institution;
use App\Jobs\SendAnnouncementWhatsAppJob;
use App\Services\Letters\LetterWorkflowService;
use App\Services\Messaging\AnnouncementMessagingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AnnouncementController extends Controller
{
    use ResolvesLettersContext;

    protected $workflow;
    protected $messaging;

    public function __construct(LetterWorkflowService $workflow, AnnouncementMessagingService $messaging)
    {
        $this->workflow = $workflow;
        $this->messaging = $messaging;
    }

    public function index(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['view_announcements', 'create_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = Announcement::query()
            ->withCount('recipients')
            ->where('institution_id', $this->institutionId($request));

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderByDesc('created_at')->paginate((int) $request->get('per_page', 15)));
    }

    public function show(Request $request, Announcement $announcement)
    {
        if (! $this->canAccessInstitution($request, $announcement->institution_id)) {
            return response()->json(['message' => 'Announcement not found.'], 404);
        }

        $announcement->load(['recipients', 'attachments', 'schedules']);

        return response()->json($announcement);
    }

    public function store(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['create_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return $this->saveAnnouncement($request);
    }

    public function update(Request $request, Announcement $announcement)
    {
        if (! $this->canAccessInstitution($request, $announcement->institution_id)) {
            return response()->json(['message' => 'Announcement not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['create_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return $this->saveAnnouncement($request, $announcement);
    }

    public function preview(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['create_announcements', 'view_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (is_string($request->recipients)) {
            $request->merge(['recipients' => json_decode($request->recipients, true) ?: []]);
        }

        $institution = Institution::find($this->institutionId($request));
        $recipient = collect($request->get('recipients', []))->first() ?: [
            'name' => 'Recipient',
            'phone' => '',
            'email' => '',
        ];

        $body = $this->workflow->personalize($request->get('body_html', ''), [
            'name' => $recipient['name'] ?? '',
            'phone' => $recipient['phone'] ?? '',
            'email' => $recipient['email'] ?? '',
            'institution_name' => optional($institution)->name,
        ]);

        return response()->json([
            'preview' => [
                'title' => $request->get('title'),
                'body_html' => $body,
                'recipient' => $recipient,
            ],
        ]);
    }

    public function send(Request $request, Announcement $announcement)
    {
        if (! $this->canAccessInstitution($request, $announcement->institution_id)) {
            return response()->json(['message' => 'Announcement not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['send_announcements', 'send_whatsapp_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $announcement->load('recipients');
        $missingPhone = $announcement->recipients->filter(function ($recipient) {
            return trim((string) $recipient->phone) === '';
        });

        if ($missingPhone->isNotEmpty()) {
            return response()->json([
                'message' => 'Some recipients are missing phone numbers.',
                'recipients_without_phone' => $missingPhone->pluck('name'),
            ], 422);
        }

        $announcement->whatsapp_status = 'pending';
        $announcement->save();

        if (config('queue.default') === 'sync') {
            $institution = Institution::find($announcement->institution_id);
            $results = $this->messaging->dispatch($announcement, optional($institution)->name);

            return response()->json([
                'message' => 'Announcement processed.',
                'results' => $results,
                'announcement' => $announcement->fresh(['recipients']),
            ]);
        }

        SendAnnouncementWhatsAppJob::dispatch($announcement->id);
        $announcement->whatsapp_status = 'scheduled';
        $announcement->save();

        return response()->json(['message' => 'Announcement queued for WhatsApp delivery.', 'announcement' => $announcement]);
    }

    public function destroy(Request $request, Announcement $announcement)
    {
        if (! $this->canAccessInstitution($request, $announcement->institution_id)) {
            return response()->json(['message' => 'Announcement not found.'], 404);
        }
        if (! $this->hasAnyPermission($request, ['create_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted.']);
    }

    protected function saveAnnouncement(Request $request, Announcement $announcement = null)
    {
        if (is_string($request->recipients)) {
            $request->merge(['recipients' => json_decode($request->recipients, true) ?: []]);
        }
        if (is_string($request->schedules)) {
            $request->merge(['schedules' => json_decode($request->schedules, true) ?: []]);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:500',
            'header_html' => 'nullable|string',
            'body_html' => 'required|string',
            'footer_html' => 'nullable|string',
            'audience_type' => 'nullable|string|max:50',
            'send_now' => 'nullable|boolean',
            'save_draft' => 'nullable|boolean',
            'scheduled_at' => 'nullable|date',
            'recipients' => 'nullable|array',
            'recipients.*.name' => 'required|string|max:255',
            'recipients.*.phone' => 'nullable|string|max:50',
            'recipients.*.email' => 'nullable|string|max:255',
            'recipients.*.recipient_type' => 'nullable|string|max:50',
            'recipients.*.recipient_id' => 'nullable|integer',
            'schedules' => 'nullable|array',
            'schedules.*' => 'date',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $recipients = $request->get('recipients', []);
        $missingPhone = collect($recipients)->filter(function ($row) {
            return trim((string) ($row['phone'] ?? '')) === '';
        });
        if ($request->boolean('send_now') && $missingPhone->isNotEmpty()) {
            return response()->json([
                'message' => 'All recipients must have a phone number before sending.',
                'recipients_without_phone' => $missingPhone->pluck('name'),
            ], 422);
        }

        $institutionId = $this->institutionId($request);
        $userId = optional($request->user())->id;
        $status = 'draft';
        if ($request->boolean('send_now')) {
            $status = 'pending';
        } elseif ($request->scheduled_at || $request->schedules) {
            $status = 'scheduled';
        } elseif ($request->boolean('save_draft')) {
            $status = 'draft';
        }

        return DB::transaction(function () use ($request, $institutionId, $userId, $status, $announcement, $recipients) {
            $isNew = $announcement === null;
            $data = [
                'institution_id' => $institutionId,
                'title' => $request->title,
                'header_html' => $request->header_html,
                'body_html' => $request->body_html,
                'footer_html' => $request->footer_html,
                'audience_type' => $request->audience_type ?: 'custom',
                'status' => $status,
                'scheduled_at' => $request->scheduled_at,
                'created_by' => $userId,
                'whatsapp_status' => $request->boolean('send_now') ? 'pending' : 'draft',
            ];

            if ($announcement) {
                $announcement->update($data);
            } else {
                $announcement = Announcement::create($data);
            }

            AnnouncementRecipient::query()->where('announcement_id', $announcement->id)->delete();
            foreach ($recipients as $row) {
                AnnouncementRecipient::create([
                    'institution_id' => $institutionId,
                    'announcement_id' => $announcement->id,
                    'recipient_type' => $row['recipient_type'] ?? 'custom',
                    'recipient_id' => $row['recipient_id'] ?? null,
                    'name' => $row['name'],
                    'email' => $row['email'] ?? null,
                    'phone' => $row['phone'] ?? null,
                    'placeholder_data' => $row['placeholder_data'] ?? [],
                    'delivery_status' => 'pending',
                ]);
            }

            AnnouncementSchedule::query()->where('announcement_id', $announcement->id)->delete();
            foreach ($request->get('schedules', []) as $when) {
                AnnouncementSchedule::create([
                    'institution_id' => $institutionId,
                    'announcement_id' => $announcement->id,
                    'scheduled_at' => $when,
                    'status' => 'pending',
                ]);
            }

            foreach ($this->attachmentFiles($request) as $file) {
                $path = $file->store('letters/announcements/'.$institutionId, 'public');
                AnnouncementAttachment::create([
                    'institution_id' => $institutionId,
                    'announcement_id' => $announcement->id,
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime_type' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                ]);
            }

            $sendResults = null;
            if ($request->boolean('send_now')) {
                $institution = Institution::find($institutionId);
                $sendResults = $this->messaging->dispatch($announcement->fresh(['recipients']), optional($institution)->name);
            }

            $code = $isNew ? 201 : 200;

            return response()->json([
                'message' => $request->boolean('send_now') ? 'Announcement processed.' : 'Announcement saved.',
                'results' => $sendResults,
                'announcement' => $announcement->fresh(['recipients', 'schedules', 'attachments']),
            ], $code);
        });
    }

    protected function attachmentFiles(Request $request): array
    {
        $files = $request->file('attachments');
        if (! $files) {
            return [];
        }

        return is_array($files) ? $files : [$files];
    }
}
