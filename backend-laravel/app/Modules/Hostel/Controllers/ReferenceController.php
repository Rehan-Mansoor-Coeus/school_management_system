<?php

namespace App\Modules\Hostel\Controllers;

use App\AcademicYear;
use App\Http\Controllers\Controller;
use App\Modules\Hostel\Concerns\ResolvesInstitution;
use App\Modules\Hostel\Models\Hostel;
use App\Student;
use Illuminate\Http\Request;

class ReferenceController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:hostel');
    }

    public function index()
    {
        $institutionId = $this->institutionId();

        return response()->json([
            'success' => true,
            'data' => [
                'hostels' => Hostel::where('institution_id', $institutionId)->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
                'academic_years' => AcademicYear::where('institution_id', $institutionId)->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            ],
        ]);
    }

    public function students(Request $request)
    {
        $query = Student::where('institution_id', $this->institutionId())
            ->where('is_active', true)
            ->with('user:id,name,email');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('registration_number', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json(['success' => true, 'data' => $query->limit(30)->get()]);
    }
}
