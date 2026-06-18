<?php

namespace App\Modules\Canteen\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Canteen\Concerns\ResolvesInstitution;
use App\Modules\Canteen\Models\CanteenMealAttendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
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
        $query = CanteenMealAttendance::with(['student.user', 'meal', 'verifier'])
            ->where('institution_id', $institutionId)
            ->orderByDesc('served_at');

        if ($request->filled('date_from')) {
            $query->whereDate('served_at', '>=', $request->get('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('served_at', '<=', $request->get('date_to'));
        }
        if ($request->filled('meal_id')) {
            $query->where('meal_id', $request->get('meal_id'));
        }
        if ($request->filled('student_id')) {
            $query->where('student_id', $request->get('student_id'));
        }

        return response()->json(['success' => true, 'data' => $query->paginate(30)]);
    }

    public function void($id)
    {
        $record = CanteenMealAttendance::where('institution_id', $this->institutionId())->findOrFail($id);
        $record->update(['status' => 'void']);

        return response()->json(['success' => true, 'message' => __('canteen.attendance_voided')]);
    }
}
