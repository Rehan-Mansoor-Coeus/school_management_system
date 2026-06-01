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
        $typeFilter = strtolower(trim((string) ($request->get('type') ?: $request->get('category', ''))));
        $selectAll = $request->boolean('all');
        $institutionId = $this->institutionId($request);
        $limit = $selectAll ? 500 : 40;
        $results = collect();

        switch ($typeFilter) {
            case 'students':
            case 'student':
                $results = $this->searchUsersByRoles($institutionId, $query, ['student'], $limit);
                break;
            case 'teachers':
            case 'teacher':
                $results = $this->searchUsersByRoles($institutionId, $query, ['teacher'], $limit);
                break;
            case 'staff':
                $results = $this->searchUsersByRoles($institutionId, $query, ['staff', 'hr-officer', 'time-sheet-supervisor'], $limit);
                break;
            case 'suppliers':
            case 'supplier':
                $results = $this->searchEntity(Supplier::class, 'supplier', $institutionId, $query, $limit);
                break;
            case 'customers':
            case 'customer':
                $results = $this->searchEntity(Customer::class, 'customer', $institutionId, $query, $limit);
                break;
            case 'users':
            case 'user':
                $results = $this->searchUsers($institutionId, $query, 'users', $limit);
                break;
            default:
                $results = $this->searchUsers($institutionId, $query, '', $limit)
                    ->merge($this->searchUsersByRoles($institutionId, $query, ['student'], $limit))
                    ->merge($this->searchUsersByRoles($institutionId, $query, ['teacher'], $limit))
                    ->merge($this->searchUsersByRoles($institutionId, $query, ['staff'], $limit))
                    ->merge($this->searchEntity(Customer::class, 'customer', $institutionId, $query, $limit))
                    ->merge($this->searchEntity(Supplier::class, 'supplier', $institutionId, $query, $limit));
                break;
        }

        return response()->json($results->unique(function ($item) {
            return ($item['type'] ?? 'x').'-'.($item['id'] ?? $item['name']);
        })->take($limit)->values());
    }

    protected function searchUsers($institutionId, $query, $typeFilter, $limit = 40)
    {
        $users = User::query()
            ->loginAccounts()
            ->where('institution_id', $institutionId)
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', 'active');
            })
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
            ->limit($limit)
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
                'recipient_type' => $type === 'user' ? 'user' : $type,
                'address' => $user->address,
            ];
        });

        if ($typeFilter !== '' && ! in_array($typeFilter, ['user', 'users'], true)) {
            $results = $results->filter(function ($item) use ($typeFilter) {
                return $item['type'] === $typeFilter || $item['role'] === $typeFilter;
            })->values();
        }

        return $results;
    }

    protected function searchUsersByRoles($institutionId, $query, array $roles, $limit = 40)
    {
        return User::query()
            ->where('institution_id', $institutionId)
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', 'active');
            })
            ->whereHas('roles', function ($q) use ($roles) {
                $q->whereIn('name', $roles);
            })
            ->when($query !== '', function ($q) use ($query) {
                $q->where(function ($inner) use ($query) {
                    $inner->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->orWhere('phone_number', 'like', "%{$query}%");
                });
            })
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(function (User $user) use ($roles) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone_number ?: $user->additional_phone_number,
                    'role' => implode(', ', $roles),
                    'type' => $roles[0],
                    'recipient_type' => $roles[0],
                    'address' => $user->address,
                ];
            });
    }

    protected function searchEntity($modelClass, $type, $institutionId, $query, $limit = 40)
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
            ->limit($limit)
            ->get()
            ->map(function ($record) use ($type) {
                return [
                    'id' => $record->id,
                    'name' => $record->name,
                    'email' => $record->email,
                    'phone' => $record->phone_number ?: $record->additional_phone_number,
                    'role' => $type,
                    'type' => $type,
                    'recipient_type' => $type,
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
