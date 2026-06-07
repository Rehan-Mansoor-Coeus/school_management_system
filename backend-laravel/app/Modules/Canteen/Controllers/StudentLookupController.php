<?php

namespace App\Modules\Canteen\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Student;
use Illuminate\Http\Request;

class StudentLookupController extends Controller
{
    use ResolvesInstitution;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:canteen');
    }

    public function index(Request $request)
    {
        $institutionId = $this->institutionId();
        $query = Student::with(['user', 'programme'])
            ->where('institution_id', $institutionId)
            ->where('is_active', true)
            ->orderByDesc('id');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('registration_number', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json(['success' => true, 'data' => $query->limit(50)->get()]);
    }
}
