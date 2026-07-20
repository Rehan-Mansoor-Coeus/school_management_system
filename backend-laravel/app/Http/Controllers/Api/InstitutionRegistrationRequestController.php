<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Institution;
use App\InstitutionRegistrationRequest;
use App\InstitutionSetting;
use App\Modules\Licensing\Models\LicensePlan;
use App\Modules\Licensing\Services\InstitutionLicenseService;
use App\Services\InstitutionModuleService;
use App\Services\InstitutionStatsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InstitutionRegistrationRequestController extends Controller
{
    protected function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        if (! $user || ! $user->hasAnyRole(['super-admin', 'system-super-admin', 'institution-admin', 'admin'])) {
            abort(403, 'Unauthorized.');
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $query = InstitutionRegistrationRequest::query()->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate((int) $request->get('per_page', 20)));
    }

    /**
     * Tabbed onboarding hub for Super Admin Institution Requests.
     * tab=all|awaiting|pending_payment|approved
     */
    public function hub(Request $request)
    {
        $this->authorizeAdmin($request);

        $tab = $request->get('tab', 'awaiting');
        $search = trim((string) $request->get('search', ''));
        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);
        $page = max((int) $request->get('page', 1), 1);

        if ($tab === 'awaiting') {
            return $this->hubAwaiting($search, $perPage, $page);
        }

        return $this->hubInstitutions($tab, $search, $perPage, $page);
    }

    public function approve(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $validator = Validator::make($request->all(), [
            'license_plan_id' => 'required|integer|exists:license_plans,id',
            'admin_notes' => 'nullable|string|max:2000',
            'type' => 'nullable|in:university,college,school,vocational,technical,training',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $record = InstitutionRegistrationRequest::findOrFail($id);

        if ($record->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved.'], 422);
        }

        if ($record->institution_id) {
            return response()->json(['message' => 'This request is already linked to an institution.'], 422);
        }

        $plan = LicensePlan::findOrFail($validator->validated()['license_plan_id']);
        $licenseService = app(InstitutionLicenseService::class);
        $totalAmount = (float) $plan->base_price + (float) $plan->setup_fee;
        // Per-student/free skip the queue; zero-priced prepaid plans activate immediately too.
        $requiresUpfrontPayment = $licenseService->requiresUpfrontPayment($plan) && $totalAmount > 0;

        $result = DB::transaction(function () use ($request, $record, $plan, $licenseService, $requiresUpfrontPayment, $validator, $totalAmount) {
            $code = $this->uniqueInstitutionCode($record->institution_name);

            $institution = Institution::create([
                'name' => $record->institution_name,
                'code' => $code,
                'type' => $validator->validated()['type'] ?? 'school',
                'email' => $record->email,
                'phone' => $record->phone,
                'country' => $record->country,
                'city' => $record->city,
                'website' => $record->website,
                'is_active' => true,
                'subscription_plan' => $plan->code,
                'subscription_status' => $requiresUpfrontPayment ? 'pending_payment' : 'active',
                'subscription_started_at' => now(),
            ]);

            InstitutionSetting::updateOrCreate(['institution_id' => $institution->id], []);
            app(InstitutionModuleService::class)->syncDefaultsForInstitution($institution->id);

            $licensePayload = [
                'license_plan_id' => $plan->id,
                'sync_plan_modules' => true,
                'start_date' => now()->toDateString(),
                'total_amount' => $totalAmount,
                'is_active' => true,
            ];

            if ($requiresUpfrontPayment) {
                $licensePayload['license_status'] = 'pending_payment';
                $licensePayload['payment_status'] = 'unpaid';
                $licensePayload['amount_paid'] = 0;
            } else {
                $licensePayload['license_status'] = 'active';
                // Free/zero-price: paid. Per-student: activate now; bill later from student counts.
                $licensePayload['payment_status'] = $plan->license_type === 'per_student_semester' ? 'pending' : 'paid';
                $licensePayload['amount_paid'] = $plan->license_type === 'per_student_semester' ? 0 : $totalAmount;
                if ($plan->license_type === 'per_student_semester') {
                    $licensePayload['total_amount'] = 0;
                }
            }

            $license = $licenseService->assignOrUpdate(
                $institution->fresh(),
                $licensePayload,
                $request->user()->id,
                $request->ip()
            );

            $record->update([
                'status' => 'approved',
                'institution_id' => $institution->id,
                'license_plan_id' => $plan->id,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'admin_notes' => $request->get('admin_notes'),
            ]);

            return [
                'request' => $record->fresh(),
                'institution' => $institution->fresh(),
                'license' => $license,
                'requires_upfront_payment' => $requiresUpfrontPayment,
            ];
        });

        return response()->json([
            'message' => $result['requires_upfront_payment']
                ? 'Request approved. Institution created and awaiting payment.'
                : 'Request approved. Institution created and activated.',
            'data' => $result['request'],
            'institution' => app(InstitutionStatsService::class)->forInstitution($result['institution']),
            'requires_upfront_payment' => $result['requires_upfront_payment'],
        ]);
    }

    public function reject(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $record = InstitutionRegistrationRequest::findOrFail($id);
        $record->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'admin_notes' => $request->get('admin_notes'),
        ]);

        return response()->json(['message' => 'Request rejected.', 'data' => $record]);
    }

    protected function hubAwaiting(string $search, int $perPage, int $page)
    {
        $query = InstitutionRegistrationRequest::query()
            ->where('status', 'pending')
            ->orderByDesc('created_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('institution_name', 'like', '%'.$search.'%')
                    ->orWhere('contact_person', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('city', 'like', '%'.$search.'%')
                    ->orWhere('country', 'like', '%'.$search.'%');
            });
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);
        $rows = collect($paginator->items())->map(function (InstitutionRegistrationRequest $row) {
            return [
                'kind' => 'request',
                'id' => $row->id,
                'request_id' => $row->id,
                'institution_id' => null,
                'name' => $row->institution_name,
                'code' => null,
                'contact_person' => $row->contact_person,
                'email' => $row->email,
                'phone' => $row->phone,
                'city' => $row->city,
                'country' => $row->country,
                'student_population' => $row->student_population,
                'status' => $row->status,
                'license' => null,
                'created_at' => optional($row->created_at)->toIso8601String(),
            ];
        })->values();

        return response()->json([
            'data' => $rows,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'tab' => 'awaiting',
        ]);
    }

    protected function hubInstitutions(string $tab, string $search, int $perPage, int $page)
    {
        $licenseService = app(InstitutionLicenseService::class);

        $query = Institution::query()->orderBy('name');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('code', 'like', '%'.$search.'%')
                    ->orWhere('city', 'like', '%'.$search.'%')
                    ->orWhere('country', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%');
            });
        }

        if ($tab === 'pending_payment' && Schema::hasTable('institution_licenses')) {
            $query->whereHas('licenses', function ($q) {
                $q->where('is_current', true)
                    ->where(function ($inner) {
                        $inner->where('license_status', 'pending_payment')
                            ->orWhere(function ($pay) {
                                $pay->whereIn('payment_status', ['unpaid', 'partially_paid', 'pending'])
                                    ->whereNotIn('license_type', ['per_student_semester', 'free']);
                            });
                    });
            });
        } elseif ($tab === 'approved' && Schema::hasTable('institution_licenses')) {
            $query->whereHas('licenses', function ($q) {
                $q->where('is_current', true)
                    ->whereIn('license_status', ['active', 'trial'])
                    ->where(function ($inner) {
                        $inner->where('payment_status', 'paid')
                            ->orWhereIn('license_type', ['per_student_semester', 'free']);
                    });
            });
        } elseif ($tab !== 'all') {
            // Unknown tab falls back to all.
            $tab = 'all';
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);
        $rows = collect($paginator->items())->map(function (Institution $institution) use ($licenseService) {
            $license = $licenseService->toCurrentLicensePayload($institution);
            $requestId = null;
            if (Schema::hasColumn('institution_registration_requests', 'institution_id')) {
                $requestId = InstitutionRegistrationRequest::where('institution_id', $institution->id)->value('id');
            }

            return [
                'kind' => 'institution',
                'id' => $institution->id,
                'request_id' => $requestId,
                'institution_id' => $institution->id,
                'name' => $institution->name,
                'code' => $institution->code,
                'contact_person' => null,
                'email' => $institution->email,
                'phone' => $institution->phone,
                'city' => $institution->city,
                'country' => $institution->country,
                'student_population' => null,
                'status' => $license['license_status'] ?? $institution->subscription_status,
                'is_active' => (bool) $institution->is_active,
                'license' => $license,
                'created_at' => optional($institution->created_at)->toIso8601String(),
            ];
        })->values();

        return response()->json([
            'data' => $rows,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'tab' => $tab,
        ]);
    }

    protected function uniqueInstitutionCode(string $name): string
    {
        $base = Str::upper(Str::slug(Str::limit($name, 20, ''), ''));
        if ($base === '') {
            $base = 'INST';
        }
        $base = Str::limit($base, 12, '');
        $code = $base;
        $i = 1;
        while (Institution::where('code', $code)->exists()) {
            $suffix = (string) $i;
            $code = Str::limit($base, 12 - strlen($suffix), '').$suffix;
            $i++;
            if ($i > 9999) {
                $code = 'INST'.Str::upper(Str::random(6));
                break;
            }
        }

        return $code;
    }
}
