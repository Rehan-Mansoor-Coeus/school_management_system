<?php

namespace App\Http\Controllers\Api\Letters;

use App\Biller;
use App\Customer;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\Supplier;
use App\User;
use Illuminate\Http\Request;

class LetterRecipientSearchController extends Controller
{
    use ResolvesLettersContext;

    protected $roleTypeMap = [
        'teacher' => 'teacher',
        'staff' => 'staff',
        'student' => 'student',
        'admin' => 'user',
        'institution-admin' => 'user',
        'super-admin' => 'user',
        'hr-officer' => 'staff',
        'time-sheet-supervisor' => 'staff',
    ];

    public function search(Request $request)
    {
        if (! $this->hasAnyPermission($request, ['create_letters', 'view_letters_menu'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = trim((string) $request->get('query', ''));
        $typeFilter = trim((string) $request->get('type', ''));
        $institutionId = $this->institutionId($request);
        $results = collect();

        if ($typeFilter === '' || in_array($typeFilter, ['user', 'users', 'teacher', 'staff', 'student'], true)) {
            $results = $results->merge($this->searchUsers($institutionId, $query, $typeFilter));
        }
        if ($typeFilter === '' || in_array($typeFilter, ['customer', 'customers'], true)) {
            $results = $results->merge($this->searchEntity(Customer::class, 'customer', $institutionId, $query));
        }
        if ($typeFilter === '' || in_array($typeFilter, ['biller', 'billers'], true)) {
            $results = $results->merge($this->searchEntity(Biller::class, 'biller', $institutionId, $query));
        }
        if ($typeFilter === '' || in_array($typeFilter, ['supplier', 'suppliers'], true)) {
            $results = $results->merge($this->searchEntity(Supplier::class, 'supplier', $institutionId, $query));
        }

        return response()->json($results->take(40)->values());
    }

    protected function searchUsers($institutionId, $query, $typeFilter)
    {
        $users = User::query()
            ->where('institution_id', $institutionId)
            ->when($query !== '', function ($q) use ($query) {
                $q->where(function ($inner) use ($query) {
                    $inner->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->orWhere('phone_number', 'like', "%{$query}%")
                        ->orWhere('additional_phone_number', 'like', "%{$query}%");
                });
            })
            ->with('roles:id,name')
            ->orderBy('name')
            ->limit(30)
            ->get();

        $results = $users->map(function (User $user) {
            $roleNames = $user->roles->pluck('name');
            $primaryRole = $roleNames->first();
            $type = $this->mapRoleToType($primaryRole);

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone_number ?: $user->additional_phone_number,
                'role' => $roleNames->implode(', ') ?: 'user',
                'type' => $type,
                'address' => null,
            ];
        });

        if ($typeFilter !== '' && ! in_array($typeFilter, ['user', 'users'], true)) {
            $results = $results->filter(function ($item) use ($typeFilter) {
                return $item['type'] === $typeFilter || $item['role'] === $typeFilter;
            })->values();
        }

        return $results;
    }

    protected function searchEntity($modelClass, $type, $institutionId, $query)
    {
        return $modelClass::query()
            ->where('institution_id', $institutionId)
            ->where('status', 'active')
            ->when($query !== '', function ($q) use ($query) {
                $q->where(function ($inner) use ($query) {
                    $inner->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->orWhere('phone_number', 'like', "%{$query}%")
                        ->orWhere('additional_phone_number', 'like', "%{$query}%");
                });
            })
            ->orderBy('name')
            ->limit(20)
            ->get()
            ->map(function ($record) use ($type) {
                return [
                    'id' => $record->id,
                    'name' => $record->name,
                    'email' => $record->email,
                    'phone' => $record->phone_number ?: $record->additional_phone_number,
                    'role' => $type,
                    'type' => $type,
                    'address' => $record->address,
                ];
            });
    }

    protected function mapRoleToType($roleName)
    {
        if (! $roleName) {
            return 'user';
        }

        $key = strtolower($roleName);

        return $this->roleTypeMap[$key] ?? 'user';
    }
}
