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
use App\Jobs\SendAnnouncementJob;
use App\Services\Letters\LetterWorkflowService;
use App\Services\Messaging\AnnouncementMessagingService;
use App\Services\Messaging\ScheduledAnnouncementProcessor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AnnouncementController extends Controller
{
    use ResolvesLettersContext;

    protected $workflow;
    protected $messaging;
    protected $scheduledProcessor;

    public function __construct(
        LetterWorkflowService $workflow,
        AnnouncementMessagingService $messaging,
        ScheduledAnnouncementProcessor $scheduledProcessor
    ) {
        $this->workflow = $workflow;
        $this->messaging = $messaging;
        $this->scheduledProcessor = $scheduledProcessor;
    }

    public function index(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['view_announcements', 'create_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($request->get('status') === 'scheduled') {
            $this->scheduledProcessor->processDue();
        }

        $query = Announcement::query()
            ->withCount('recipients')
            ->with(['schedules' => function ($q) {
                $q->orderBy('scheduled_at');
            }])
            ->where('institution_id', $this->institutionId($request));

        if ($request->filled('status')) {
            if ($request->status === 'scheduled') {
                $query->where(function ($q) {
                    $q->where('status', 'scheduled')
                        ->orWhereHas('schedules', function ($s) {
                            $s->where('status', 'pending');
                        });
                });
            } else {
                $query->where('status', $request->status);
            }
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

        $recipients = collect($request->get('recipients', []));
        if ($recipients->isEmpty()) {
            return response()->json(['message' => 'Select at least one recipient to preview.'], 422);
        }

        $institution = Institution::find($this->institutionId($request));
        $attachmentFiles = $this->attachmentFiles($request);
        $attachmentName = ! empty($attachmentFiles) ? $attachmentFiles[0]->getClientOriginalName() : null;

        $previews = $recipients->map(function ($recipient) use ($request, $institution) {
            $data = [
                'name' => $recipient['name'] ?? '',
                'phone' => $recipient['phone'] ?? $recipient['phone_number'] ?? '',
                'phone_number' => $recipient['phone'] ?? $recipient['phone_number'] ?? '',
                'email' => $recipient['email'] ?? '',
                'address' => $recipient['address'] ?? '',
                'institution_name' => optional($institution)->name,
                'date' => now()->format('M d, Y'),
            ];

            $body = $this->workflow->personalize($request->get('body_html', ''), $data);
            $header = $this->workflow->personalize($request->get('header_html', ''), $data);

            $plain = trim(strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</div>'], "\n", $body)));
            $headerPlain = trim(strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>', '</div>'], "\n", $header)));
            $messageParts = array_filter([$headerPlain, $plain]);
            $fullMessage = trim(implode("\n\n", $messageParts));

            return [
                'name' => $recipient['name'] ?? '',
                'email' => $recipient['email'] ?? null,
                'phone' => $recipient['phone'] ?? $recipient['phone_number'] ?? null,
                'address' => $recipient['address'] ?? null,
                'personalized_message' => $fullMessage,
                'body_html' => $body,
                'header_html' => $header,
            ];
        });

        return response()->json([
            'preview' => [
                'title' => $request->get('title'),
                'subject' => $request->get('title'),
                'attachment_name' => $attachmentName,
                'recipients' => $previews->values(),
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

        AnnouncementSchedule::query()
            ->where('announcement_id', $announcement->id)
            ->where('status', 'pending')
            ->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

        if (config('queue.default') === 'sync') {
            $institution = Institution::find($announcement->institution_id);
            $results = $this->messaging->dispatch($announcement, optional($institution)->name);

            return response()->json([
                'message' => 'Announcement processed.',
                'results' => $results,
                'announcement' => $announcement->fresh(['recipients']),
            ]);
        }

        SendAnnouncementJob::dispatch($announcement->id)->onQueue('whatsapp');
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

    public function bulkDestroy(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['create_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $institutionId = $this->institutionId($request);
        $deleted = Announcement::query()
            ->where('institution_id', $institutionId)
            ->whereIn('id', $request->ids)
            ->delete();

        return response()->json(['message' => "{$deleted} announcement(s) deleted.", 'deleted' => $deleted]);
    }

    protected function saveAnnouncement(Request $request, Announcement $announcement = null)
    {
        if (is_string($request->recipients)) {
            $request->merge(['recipients' => json_decode($request->recipients, true) ?: []]);
        }
        if (is_string($request->schedules)) {
            $request->merge(['schedules' => json_decode($request->schedules, true) ?: []]);
        }

        $this->normalizeScheduleInput($request);

        $isDraft = $request->boolean('save_draft') || $request->boolean('save_as_template');
        $isSendNow = $request->boolean('send_now') && ! $request->boolean('schedule_for_later');
        $isSchedule = $request->boolean('schedule_for_later');

        if (! $request->filled('title') || trim((string) $request->title) === '') {
            $request->merge(['title' => $isDraft ? 'Untitled Draft' : 'WhatsApp Announcement']);
        }

        $validator = Validator::make($request->all(), [
            'title' => ($isDraft ? 'nullable' : 'required').'|string|max:500',
            'category' => 'nullable|string|max:50',
            'header_html' => 'nullable|string',
            'body_html' => 'required|string',
            'footer_html' => 'nullable|string',
            'audience_type' => 'nullable|string|max:50',
            'send_now' => 'nullable',
            'save_draft' => 'nullable',
            'save_as_template' => 'nullable',
            'schedule_for_later' => 'nullable',
            'scheduled_at' => 'nullable|date',
            'recipients' => 'nullable|array',
            'recipients.*.name' => 'required_with:recipients|string|max:255',
            'recipients.*.phone' => 'nullable|string|max:50',
            'recipients.*.email' => 'nullable|string|max:255',
            'recipients.*.address' => 'nullable|string',
            'recipients.*.recipient_type' => 'nullable|string|max:50',
            'recipients.*.recipient_id' => 'nullable|integer',
            'recipients.*.additional_phone' => 'nullable|string|max:50',
            'schedules' => 'nullable|array',
            'schedules.*' => 'date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors(), 'message' => 'Validation failed.'], 422);
        }

        $attachmentFiles = $this->attachmentFiles($request);
        foreach ($attachmentFiles as $file) {
            if ($file->getSize() > 10 * 1024 * 1024) {
                return response()->json(['message' => 'Each attachment must be 10MB or smaller.'], 422);
            }
        }

        $recipients = $this->expandRecipients($request->get('recipients', []));
        if (($isSendNow || $isSchedule) && count($recipients) === 0) {
            return response()->json(['message' => 'Select at least one recipient before sending.'], 422);
        }

        $missingPhone = collect($recipients)->filter(function ($row) {
            return trim((string) ($row['phone'] ?? '')) === '';
        });
        if ($isSendNow && $missingPhone->isNotEmpty()) {
            return response()->json([
                'message' => 'All recipients must have a phone number before sending.',
                'recipients_without_phone' => $missingPhone->pluck('name'),
            ], 422);
        }

        $institutionId = $this->institutionId($request);
        $userId = optional($request->user())->id;
        $status = 'draft';
        if ($request->boolean('schedule_for_later') || $request->scheduled_at || $request->schedules) {
            $status = 'scheduled';
        } elseif ($isSendNow) {
            $status = 'pending';
        } elseif ($isDraft) {
            $status = 'draft';
        }

        return DB::transaction(function () use ($request, $institutionId, $userId, $status, $announcement, $recipients, $isSendNow, $attachmentFiles) {
            $isNew = $announcement === null;
            $data = [
                'institution_id' => $institutionId,
                'title' => $request->title,
                'category' => $request->get('category', 'general'),
                'header_html' => $request->header_html,
                'body_html' => $request->body_html,
                'footer_html' => $request->footer_html,
                'audience_type' => $request->audience_type ?: 'users',
                'status' => $status,
                'scheduled_at' => $request->scheduled_at,
                'created_by' => $userId,
                'whatsapp_status' => $isSendNow ? 'pending' : ($status === 'scheduled' ? 'scheduled' : 'draft'),
            ];

            if ($announcement) {
                $announcement->update($data);
            } else {
                $data['reference'] = $this->workflow->generateReference($institutionId);
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
                    'address' => $row['address'] ?? null,
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

            foreach ($attachmentFiles as $index => $file) {
                $path = $file->store('letters/announcements/'.$institutionId, 'public');
                if ($index === 0) {
                    $announcement->attachment_path = $path;
                    $announcement->save();
                }
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
            if ($isSendNow) {
                if (config('queue.default') === 'sync') {
                    $institution = Institution::find($institutionId);
                    $sendResults = $this->messaging->dispatch($announcement->fresh(['recipients']), optional($institution)->name);
                } else {
                    SendAnnouncementJob::dispatch($announcement->id)->onQueue('whatsapp');
                    $sendResults = ['queued' => true, 'total' => count($recipients)];
                }
            }

            $code = $isNew ? 201 : 200;

            $response = response()->json([
                'message' => $isSendNow ? 'Announcement processed.' : ($status === 'scheduled' ? 'Announcement scheduled for automatic delivery.' : 'Announcement saved.'),
                'results' => $sendResults,
                'announcement' => $announcement->fresh(['recipients', 'schedules', 'attachments']),
            ], $code);

            return $response;
        });
    }

    public function processScheduled(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['view_announcements', 'create_announcements'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $processed = $this->scheduledProcessor->processDue();

        return response()->json(['message' => 'Scheduled announcements processed.', 'processed' => $processed]);
    }

    protected function expandRecipients(array $recipients): array
    {
        $expanded = [];

        foreach ($recipients as $row) {
            $phones = [];
            $primary = trim((string) ($row['phone'] ?? $row['phone_number'] ?? ''));
            $additional = trim((string) ($row['additional_phone'] ?? $row['additional_phone_number'] ?? ''));

            if ($primary !== '') {
                $phones[] = $primary;
            }
            if ($additional !== '' && $additional !== $primary) {
                $phones[] = $additional;
            }

            if (empty($phones)) {
                $expanded[] = $row;
                continue;
            }

            foreach ($phones as $index => $phone) {
                $expanded[] = array_merge($row, [
                    'phone' => $phone,
                    'placeholder_data' => array_merge($row['placeholder_data'] ?? [], [
                        'phone_index' => $index + 1,
                        'phone_total' => count($phones),
                    ]),
                ]);
            }
        }

        return $expanded;
    }

    protected function normalizeScheduleInput(Request $request): void
    {
        $scheduleList = collect($request->get('schedules', []))
            ->map(function ($value) {
                return $this->normalizeDateTimeString($value);
            })
            ->filter()
            ->values()
            ->all();

        if ($request->filled('scheduled_at')) {
            $first = $this->normalizeDateTimeString($request->scheduled_at);
            if ($first && empty($scheduleList)) {
                $scheduleList = [$first];
            }
        }

        if (! empty($scheduleList)) {
            $request->merge([
                'schedules' => $scheduleList,
                'scheduled_at' => $scheduleList[0],
            ]);
        }
    }

    protected function normalizeDateTimeString($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $value = trim(str_replace('T', ' ', (string) $value));

        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $value)) {
            $value .= ':00';
        }

        try {
            return \Carbon\Carbon::parse($value)->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            return null;
        }
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
