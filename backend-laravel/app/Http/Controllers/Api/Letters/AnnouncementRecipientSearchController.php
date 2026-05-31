<?php

namespace App\Http\Controllers\Api\Letters;

use App\Biller;
use App\Customer;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\Supplier;
use App\User;
use Illuminate\Http\Request;

class AnnouncementRecipientSearchController extends Controller
{
    use ResolvesLettersContext;

    public function search(Request $request)
    {
        if (! $this->hasAnyPermission($request, [
            'create_announcements', 'view_announcements', 'send_whatsapp_announcements',
            'manage_announcement_recipients', 'view_letters_menu',
        ])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $category = strtolower(trim((string) $request->get('category', 'users')));
        $query = trim((string) $request->get('query', ''));
        $institutionId = $this->institutionId($request);

        $results = collect();

        switch ($category) {
            case 'customers':
            case 'customer':
                $results = $this->searchEntity(Customer::class, 'customer', $institutionId, $query);
                break;
            case 'billers':
            case 'biller':
                $results = $this->searchEntity(Biller::class, 'biller', $institutionId, $query);
                break;
            case 'suppliers':
            case 'supplier':
                $results = $this->searchEntity(Supplier::class, 'supplier', $institutionId, $query);
                break;
            case 'students':
            case 'student':
                $results = $this->searchUsersByRoles($institutionId, $query, ['student']);
                break;
            case 'teachers':
            case 'teacher':
                $results = $this->searchUsersByRoles($institutionId, $query, ['teacher']);
                break;
            case 'staff':
                $results = $this->searchUsersByRoles($institutionId, $query, ['staff', 'hr-officer', 'time-sheet-supervisor']);
                break;
            case 'users':
            case 'user':
            default:
                $results = $this->searchUsers($institutionId, $query);
                break;
        }

        return response()->json($results->take(40)->values());
    }

    protected function searchUsers($institutionId, $query)
    {
        return User::query()
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
            ->orderBy('name')
            ->limit(25)
            ->get()
            ->map(fn (User $user) => $this->mapUser($user, 'user'));
    }

    protected function searchUsersByRoles($institutionId, $query, array $roles)
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
            ->limit(25)
            ->get()
            ->map(function (User $user) use ($roles) {
                $type = in_array('student', $roles, true) ? 'student' : (in_array('teacher', $roles, true) ? 'teacher' : 'staff');

                return $this->mapUser($user, $type);
            });
    }

    protected function mapUser(User $user, string $type): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone_number' => $user->phone_number ?: $user->additional_phone_number,
            'address' => null,
            'recipient_type' => $type,
        ];
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
            ->limit(25)
            ->get()
            ->map(function ($record) use ($type) {
                return [
                    'id' => $record->id,
                    'name' => $record->name,
                    'email' => $record->email,
                    'phone_number' => $record->phone_number ?: $record->additional_phone_number,
                    'address' => $record->address,
                    'recipient_type' => $type,
                ];
            });
    }
}
