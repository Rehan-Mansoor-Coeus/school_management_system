<?php

namespace App\Http\Controllers\Api\Landing;

use App\Http\Controllers\Controller;
use App\Institution;
use App\InstitutionRegistrationRequest;
use App\GeneralSetting;
use App\Programme;
use App\ProgramSubject;
use App\Subject;
use App\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class LandingController extends Controller
{
    public function settings()
    {
        $settings = GeneralSetting::current();

        return response()->json([
            'student_registration_fee' => (float) $settings->student_registration_fee,
            'registration_fee_currency' => $settings->registration_fee_currency,
            'registration_fee_period' => $settings->registration_fee_period,
            'registration_fee_label' => $this->formatFeeLabel($settings),
        ]);
    }

    public function institutions(Request $request)
    {
        $query = Institution::query()
            ->where('is_active', true)
            ->orderBy('name');

        if ($search = trim((string) $request->get('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('country', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);

        $paginated = $query->paginate($perPage, [
            'id', 'name', 'code', 'type', 'city', 'country', 'logo', 'description', 'currency',
        ]);

        $paginated->getCollection()->transform(function (Institution $institution) {
            return $this->summarizeInstitution($institution);
        });

        return response()->json($paginated);
    }

    public function institution($id)
    {
        $institution = Institution::query()
            ->where('is_active', true)
            ->with('settings')
            ->findOrFail($id);

        $programmes = Programme::query()
            ->where('institution_id', $institution->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'description', 'level', 'duration_years', 'registration_fee', 'tuition_fee']);

        $subjects = Subject::query()
            ->where('institution_id', $institution->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'name', 'code', 'description']);

        return response()->json([
            'institution' => $this->summarizeInstitution($institution, true),
            'registration_fee' => $this->resolveRegistrationFee($institution),
            'programmes' => $programmes,
            'courses' => $subjects,
            'admission_requirements' => $this->resolveAdmissionRequirements($institution),
        ]);
    }

    public function programmeCourses($institutionId, $programmeId)
    {
        $institution = Institution::query()->where('is_active', true)->findOrFail($institutionId);
        $programme = Programme::query()
            ->where('institution_id', $institution->id)
            ->where('is_active', true)
            ->findOrFail($programmeId);

        $courses = ProgramSubject::query()
            ->with(['subject:id,name,code,description', 'semester:id,semester_number,level_number'])
            ->where('institution_id', $institution->id)
            ->where('programme_id', $programme->id)
            ->where('is_active', true)
            ->orderBy('programme_semester_id')
            ->get()
            ->map(function (ProgramSubject $link) {
                return [
                    'id' => $link->subject->id ?? $link->id,
                    'name' => optional($link->subject)->name,
                    'code' => optional($link->subject)->code,
                    'description' => optional($link->subject)->description,
                    'is_required' => (bool) $link->is_required,
                    'semester' => $link->semester ? [
                        'id' => $link->semester->id,
                        'semester_number' => $link->semester->semester_number,
                        'level_number' => $link->semester->level_number,
                    ] : null,
                ];
            })
            ->filter(fn ($row) => ! empty($row['name']))
            ->values();

        return response()->json([
            'programme' => [
                'id' => $programme->id,
                'name' => $programme->name,
                'code' => $programme->code,
                'level' => $programme->level,
                'description' => $programme->description,
            ],
            'courses' => $courses,
        ]);
    }

    public function storeInstitutionRequest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'institution_name' => 'required|string|max:255',
            'country' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'contact_person' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'required|email|max:255',
            'student_population' => 'nullable|integer|min:1',
            'website' => 'nullable|string|max:255',
            'message' => 'nullable|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $record = InstitutionRegistrationRequest::create(array_merge(
            $validator->validated(),
            ['status' => 'pending']
        ));

        $this->notifyAlphaBridge('New institution registration request', $this->formatInstitutionRequestEmail($record));

        return response()->json([
            'message' => 'Your request has been submitted. Our team will review it and contact you.',
            'data' => $record,
        ], 201);
    }

    public function storeSupportTicket(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'institution' => 'nullable|string|max:255',
            'question' => 'required|string|max:5000',
            'source' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ticket = SupportTicket::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'institution' => $request->institution,
            'question' => $request->question,
            'source' => $request->get('source', 'mbole'),
            'status' => 'open',
        ]);

        $this->notifyAlphaBridge('ASSMS Support Ticket #'.$ticket->id, $this->formatSupportTicketEmail($ticket));

        return response()->json([
            'message' => 'Support request received. Our team will contact you shortly.',
            'data' => ['id' => $ticket->id],
        ], 201);
    }

    protected function summarizeInstitution(Institution $institution, bool $detailed = false): array
    {
        $institution->loadMissing('settings');

        $data = [
            'id' => $institution->id,
            'name' => $institution->name,
            'code' => $institution->code,
            'type' => $institution->type,
            'city' => $institution->city,
            'country' => $institution->country,
            'logo_url' => $institution->logo_url,
            'currency' => $institution->currency,
            'registration_fee' => $this->resolveRegistrationFee($institution),
        ];

        if ($detailed) {
            $data['description'] = $institution->description;
            $data['website'] = $institution->website;
            $data['email'] = $institution->email;
            $data['phone'] = $institution->phone;
            $data['address'] = $institution->address;
            $data['mission'] = $institution->mission;
            $data['vision'] = $institution->vision;
        }

        return $data;
    }

    protected function resolveRegistrationFee(Institution $institution): array
    {
        $fee = 0;
        $currency = $institution->currency ?: 'USD';
        $settings = $institution->settings;
        $feeStructure = $settings ? ($settings->fee_structure ?: []) : [];

        if (is_array($feeStructure)) {
            foreach ($feeStructure as $item) {
                if (is_array($item) && ($item['key'] ?? '') === 'registration_fee') {
                    $fee = (float) ($item['amount'] ?? 0);
                    break;
                }
            }
        }

        if ($fee <= 0) {
            $programmeFee = Programme::query()
                ->where('institution_id', $institution->id)
                ->where('is_active', true)
                ->where('registration_fee', '>', 0)
                ->min('registration_fee');
            if ($programmeFee) {
                $fee = (float) $programmeFee;
            }
        }

        return [
            'amount' => $fee,
            'currency' => $currency,
            'label' => 'Registration Fee',
        ];
    }

    protected function resolveAdmissionRequirements(Institution $institution): array
    {
        $requirements = [];
        $settings = $institution->settings;
        $structure = $settings ? ($settings->academic_structure ?: []) : [];

        if (is_array($structure)) {
            $text = $structure['admission_requirements'] ?? $structure['requirements'] ?? null;
            if (is_string($text) && trim($text) !== '') {
                $requirements[] = trim($text);
            }
            if (is_array($text)) {
                $requirements = array_merge($requirements, array_filter(array_map('strval', $text)));
            }
        }

        if ($institution->description) {
            $requirements[] = 'Review programme-specific requirements before applying.';
        }

        if (empty($requirements)) {
            $requirements = [
                'Completed application form',
                'Valid identification documents',
                'Academic transcripts',
                'Registration fee payment',
            ];
        }

        return array_values(array_unique($requirements));
    }

    protected function formatFeeLabel(GeneralSetting $settings): string
    {
        $period = str_replace('_', ' ', $settings->registration_fee_period ?: 'per_semester');

        return ucwords($period);
    }

    protected function notifyAlphaBridge(string $subject, string $body): void
    {
        $to = 'info@alpha-bridge.net';

        try {
            Mail::raw($body, function ($message) use ($subject, $to) {
                $message->to($to)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::warning('Landing notification email failed', [
                'subject' => $subject,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function formatInstitutionRequestEmail(InstitutionRegistrationRequest $record): string
    {
        return implode("\n", [
            'Institution: '.$record->institution_name,
            'Country: '.($record->country ?: '—'),
            'City: '.($record->city ?: '—'),
            'Contact: '.$record->contact_person,
            'Phone: '.$record->phone,
            'Email: '.$record->email,
            'Student population: '.($record->student_population ?: '—'),
            'Website: '.($record->website ?: '—'),
            'Message: '.($record->message ?: '—'),
        ]);
    }

    protected function formatSupportTicketEmail(SupportTicket $ticket): string
    {
        return implode("\n", [
            'From: '.$ticket->name,
            'Email: '.$ticket->email,
            'Phone: '.($ticket->phone ?: '—'),
            'Institution: '.($ticket->institution ?: '—'),
            'Source: '.$ticket->source,
            'Question:',
            $ticket->question,
        ]);
    }
}
