<?php

namespace App\Http\Controllers\Api\People;

use App\Biller;
use App\Customer;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\People\Concerns\ResolvesPeopleContext;
use App\Supplier;
use App\User;
use Illuminate\Http\Request;

class PeopleRecipientSearchController extends Controller
{
    use ResolvesPeopleContext;

    public function search(Request $request)
    {
        if (! $this->hasAnyPermission($request, [
            'create_announcements', 'view_announcements', 'send_whatsapp_announcements', 'create_letters', 'view_letters_menu',
        ])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = trim((string) $request->get('query', ''));
        $source = strtolower(trim((string) $request->get('source', 'all')));
        $institutionId = $this->institutionId($request);
        $results = collect();

        if (in_array($source, ['all', 'users', 'user'], true)) {
            $results = $results->merge($this->searchUsers($institutionId, $query));
        }
        if (in_array($source, ['all', 'customers', 'customer'], true)) {
            $results = $results->merge($this->searchEntity(Customer::class, 'customer', $institutionId, $query));
        }
        if (in_array($source, ['all', 'billers', 'biller'], true)) {
            $results = $results->merge($this->searchEntity(Biller::class, 'biller', $institutionId, $query));
        }
        if (in_array($source, ['all', 'suppliers', 'supplier'], true)) {
            $results = $results->merge($this->searchEntity(Supplier::class, 'supplier', $institutionId, $query));
        }
        if (in_array($source, ['all', 'students', 'student'], true)) {
            $results = $results->merge($this->searchUsersByRoles($institutionId, $query, ['student'], 'student'));
        }
        if (in_array($source, ['teachers', 'teacher'], true)) {
            $results = $results->merge($this->searchUsersByRoles($institutionId, $query, ['teacher'], 'teacher'));
        }
        if (in_array($source, ['staff'], true)) {
            $results = $results->merge($this->searchUsersByRoles($institutionId, $query, ['staff'], 'staff'));
        }

        return response()->json($results->take(40)->values());
    }

    protected function searchUsers($institutionId, $query)
    {
        return User::query()
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
            ->limit(20)
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone_number ?: $user->additional_phone_number,
                    'type' => 'user',
                    'role' => optional($user->roles->first())->name ?? 'user',
                    'address' => $user->address,
                ];
            });
    }

    protected function searchUsersByRoles($institutionId, $query, array $roles, $type)
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
                        ->orWhere('phone_number', 'like', "%{$query}%")
                        ->orWhere('additional_phone_number', 'like', "%{$query}%");
                });
            })
            ->orderBy('name')
            ->limit(20)
            ->get()
            ->map(function (User $user) use ($type) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone_number ?: $user->additional_phone_number,
                    'type' => $type,
                    'role' => $type,
                    'address' => $user->address,
                ];
            });
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
                    'type' => $type,
                    'role' => $type,
                    'address' => $record->address,
                ];
            });
    }
}
