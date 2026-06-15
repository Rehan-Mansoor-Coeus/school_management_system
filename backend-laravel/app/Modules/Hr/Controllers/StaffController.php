<?php

namespace App\Modules\Hr\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Concerns\ResolvesInstitution;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api')->except([]);
        $this->middleware('module_enabled:hr');
    }


    public function index(Request $request)
    {
        $institutionId = $this->institutionId();
        $query = \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $institutionId);

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }
        if ($request->filled('q')) {
            $search = '%' . trim($request->get('q')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', $search)
                    ->orWhere('last_name', 'like', $search)
                    ->orWhere('staff_code', 'like', $search)
                    ->orWhere('email', 'like', $search);
            });
        }

        return response()->json(['success' => true, 'data' => $query->orderBy('id', 'desc')->get()]);
    }

    public function nextCode(\App\Modules\Hr\Services\HrStaffService $service)
    {
        return response()->json([
            'success' => true,
            'data' => ['staff_code' => $service->nextStaffCode($this->institutionId())],
        ]);
    }

    public function show($id)
    {
        $data = \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $this->institutionId())->findOrFail($id);

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request, \App\Modules\Hr\Services\HrStaffService $service)
    {
        $payload = $request->validate([
            'user_id' => 'nullable|integer|exists:users,id',
            'staff_code' => 'nullable|string|max:40',
            'first_name' => 'nullable|string|max:120',
            'last_name' => 'nullable|string|max:120',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:40',
            'category_id' => 'required|integer',
            'position' => 'nullable|string|max:120',
            'department' => 'nullable|string|max:120',
            'payment_type' => 'nullable|in:daily,monthly',
            'daily_rate' => 'nullable|numeric',
            'monthly_salary' => 'nullable|numeric',
            'contract_start' => 'nullable|date',
            'contract_end' => 'nullable|date',
            'hire_date' => 'nullable|date',
            'bank_name' => 'nullable|string|max:120',
            'bank_account' => 'nullable|string|max:80',
            'status' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);

        $institutionId = $this->institutionId();
        $payload['institution_id'] = $institutionId;
        $payload['staff_code'] = $payload['staff_code'] ?? $service->nextStaffCode($institutionId);
        $payload['status'] = $payload['status'] ?? 'active';
        $payload['payment_type'] = $payload['payment_type'] ?? 'daily';
        $payload['created_by'] = auth()->id();

        if (! empty($payload['user_id'])) {
            $user = \App\User::where('institution_id', $institutionId)->findOrFail($payload['user_id']);
            if (empty($payload['first_name'])) {
                $parts = preg_split('/\s+/', trim((string) $user->name));
                $payload['first_name'] = isset($parts[0]) ? $parts[0] : 'Staff';
                $payload['last_name'] = isset($parts[1]) ? implode(' ', array_slice($parts, 1)) : ($payload['last_name'] ?? '');
            }
            $payload['email'] = $payload['email'] ?? $user->email;
            $payload['phone'] = $payload['phone'] ?? $user->phone_number;
            $service->promoteUserToStaff($institutionId, $user->id);
        }

        if (empty($payload['first_name'])) {
            return response()->json(['success' => false, 'message' => 'first_name is required when user_id is not provided'], 422);
        }

        $data = \App\Modules\Hr\Models\HrStaffProfile::create($payload);

        return response()->json(['success' => true, 'data' => $data], 201);
    }

    public function update(Request $request, $id, \App\Modules\Hr\Services\HrStaffService $service)
    {
        $institutionId = $this->institutionId();
        $data = \App\Modules\Hr\Models\HrStaffProfile::where('institution_id', $institutionId)->findOrFail($id);

        $payload = $request->only([
            'user_id','first_name','last_name','email','phone','category_id','position','department',
            'payment_type','daily_rate','monthly_salary','contract_start','contract_end','hire_date',
            'bank_name','bank_account','status','notes'
        ]);

        if (array_key_exists('user_id', $payload) && ! empty($payload['user_id'])) {
            $user = \App\User::where('institution_id', $institutionId)->findOrFail($payload['user_id']);
            $service->promoteUserToStaff($institutionId, $user->id);
        }

        $data->update($payload);

        return response()->json(['success' => true, 'data' => $data->fresh()]);
    }

    public function usersSearch(Request $request, \App\Modules\Hr\Services\HrStaffService $service)
    {
        $institutionId = $this->institutionId();
        $q = trim((string) $request->get('q', ''));
        if (strlen($q) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $like = '%' . $q . '%';
        $users = \App\User::where('institution_id', $institutionId)
            ->where(function ($query) use ($like) {
                $query->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('phone_number', 'like', $like);
            })
            ->select(['id','name','email','phone_number'])
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
            'next_staff_code' => $service->nextStaffCode($institutionId),
        ]);
    }

}
