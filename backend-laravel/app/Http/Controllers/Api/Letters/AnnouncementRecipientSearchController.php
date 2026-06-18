<?php

namespace App\Http\Controllers\Api\Letters;

use App\Biller;
use App\Customer;
use App\Fee;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Letters\Concerns\ResolvesLettersContext;
use App\Services\Fees\FeeStatusService;
use App\Student;
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
        $selectAll = $request->boolean('all');
        $institutionId = $this->institutionId($request);
        $limit = $selectAll ? 500 : 25;

        $results = collect();

        switch ($category) {
            case 'customers':
            case 'customer':
                $results = $this->searchEntity(Customer::class, 'customer', $institutionId, $query, $limit);
                break;
            case 'billers':
            case 'biller':
                $results = $this->searchEntity(Biller::class, 'biller', $institutionId, $query, $limit);
                break;
            case 'suppliers':
            case 'supplier':
                $results = $this->searchEntity(Supplier::class, 'supplier', $institutionId, $query, $limit);
                break;
            case 'students':
            case 'student':
                $results = $this->searchUsersByRoles($institutionId, $query, ['student'], $limit);
                break;
            case 'students_programme':
                $results = $this->searchStudentsByProgramme($institutionId, $query, (int) $request->get('programme_id'), $limit);
                break;
            case 'students_level':
                $results = $this->searchStudentsByLevel($institutionId, $query, (int) $request->get('level_number'), $limit);
                break;
            case 'students_semester':
                $results = $this->searchStudentsBySemester($institutionId, $query, (int) $request->get('programme_semester_id'), $limit);
                break;
            case 'students_payment_status':
                $results = $this->searchStudentsByPaymentStatus($institutionId, $query, (string) $request->get('payment_status'), $limit);
                break;
            case 'teachers':
            case 'teacher':
                $results = $this->searchUsersByRoles($institutionId, $query, ['teacher'], $limit);
                break;
            case 'staff':
                $results = $this->searchUsersByRoles($institutionId, $query, ['staff', 'hr-officer', 'time-sheet-supervisor'], $limit);
                break;
            case 'users':
            case 'user':
            default:
                $results = $this->searchUsers($institutionId, $query, $limit);
                break;
        }

        return response()->json($results->take($selectAll ? 500 : 40)->values());
    }

    protected function searchUsers($institutionId, $query, $limit = 25)
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
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(fn (User $user) => $this->mapUser($user, 'user'));
    }

    protected function searchUsersByRoles($institutionId, $query, array $roles, $limit = 25)
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
            ->limit($limit)
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
            'phone_number' => $user->phone_number,
            'additional_phone_number' => $user->additional_phone_number,
            'address' => null,
            'recipient_type' => $type,
        ];
    }

    protected function searchEntity($modelClass, $type, $institutionId, $query, $limit = 25)
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
                    'phone_number' => $record->phone_number,
                    'additional_phone_number' => $record->additional_phone_number,
                    'address' => $record->address,
                    'recipient_type' => $type,
                ];
            });
    }

    protected function searchStudentsByProgramme($institutionId, $query, $programmeId, $limit = 25)
    {
        if ($programmeId <= 0) {
            return collect();
        }

        return $this->mapStudentUsers(
            Student::query()
                ->where('institution_id', $institutionId)
                ->where('programme_id', $programmeId)
                ->whereHas('user')
                ->with('user')
                ->when($query !== '', function ($q) use ($query) {
                    $q->where(function ($inner) use ($query) {
                        $inner->where('registration_number', 'like', "%{$query}%")
                            ->orWhereHas('user', function ($userQuery) use ($query) {
                                $userQuery->where('name', 'like', "%{$query}%")
                                    ->orWhere('email', 'like', "%{$query}%");
                            });
                    });
                })
                ->limit($limit)
                ->get()
        );
    }

    protected function searchStudentsByLevel($institutionId, $query, $levelNumber, $limit = 25)
    {
        if ($levelNumber <= 0) {
            return collect();
        }

        return $this->mapStudentUsers(
            Student::query()
                ->where('institution_id', $institutionId)
                ->where('current_level', $levelNumber)
                ->whereHas('user')
                ->with('user')
                ->when($query !== '', function ($q) use ($query) {
                    $q->whereHas('user', function ($userQuery) use ($query) {
                        $userQuery->where('name', 'like', "%{$query}%")
                            ->orWhere('email', 'like', "%{$query}%");
                    });
                })
                ->limit($limit)
                ->get()
        );
    }

    protected function searchStudentsBySemester($institutionId, $query, $programmeSemesterId, $limit = 25)
    {
        if ($programmeSemesterId <= 0 || ! \Schema::hasTable('fees')) {
            return collect();
        }

        $studentIds = Fee::where('institution_id', $institutionId)
            ->where('programme_semester_id', $programmeSemesterId)
            ->pluck('student_id');

        return $this->mapStudentUsers(
            Student::query()
                ->whereIn('id', $studentIds)
                ->whereHas('user')
                ->with('user')
                ->when($query !== '', function ($q) use ($query) {
                    $q->whereHas('user', function ($userQuery) use ($query) {
                        $userQuery->where('name', 'like', "%{$query}%");
                    });
                })
                ->limit($limit)
                ->get()
        );
    }

    protected function searchStudentsByPaymentStatus($institutionId, $query, $paymentStatus, $limit = 25)
    {
        if ($paymentStatus === '' || ! \Schema::hasTable('fees')) {
            return collect();
        }

        $statusService = new FeeStatusService();
        $fees = Fee::with('student.user')->where('institution_id', $institutionId)->get();
        $studentIds = $fees->filter(function (Fee $fee) use ($statusService, $paymentStatus) {
            return $statusService->calculate($fee) === $paymentStatus;
        })->pluck('student_id')->unique()->filter();

        return $this->mapStudentUsers(
            Student::query()
                ->whereIn('id', $studentIds)
                ->whereHas('user')
                ->with('user')
                ->when($query !== '', function ($q) use ($query) {
                    $q->whereHas('user', function ($userQuery) use ($query) {
                        $userQuery->where('name', 'like', "%{$query}%");
                    });
                })
                ->limit($limit)
                ->get()
        );
    }

    protected function mapStudentUsers($students)
    {
        return collect($students)->map(function (Student $student) {
            $user = $student->user;
            if (! $user) {
                return null;
            }

            return $this->mapUser($user, 'student');
        })->filter()->values();
    }
}
