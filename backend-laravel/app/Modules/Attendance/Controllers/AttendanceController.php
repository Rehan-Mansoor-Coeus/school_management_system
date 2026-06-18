<?php

namespace App\Modules\Attendance\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    protected function institutionId()
    {
        $user = auth()->user();
        if (! $user || ! $user->institution_id) {
            abort(422, 'Institution context is required.');
        }

        return (int) $user->institution_id;
    }

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->middleware('module_enabled:attendance');
    }

    public function clockIn(Request $request)
    {
        $data = $request->validate([
            'notes' => 'nullable|string',
            'source' => 'nullable|string|max:30',
        ]);

        $institutionId = $this->institutionId();
        $userId = (int) auth()->id();

        $open = DB::table('attendance_records')
            ->where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->whereNull('clock_out_at')
            ->first();

        if ($open) {
            return response()->json(['success' => false, 'data' => null, 'message' => 'You already have an open attendance record.'], 422);
        }

        $id = DB::table('attendance_records')->insertGetId([
            'institution_id' => $institutionId,
            'user_id' => $userId,
            'clock_in_at' => now(),
            'clock_out_at' => null,
            'source' => $data['source'] ?? 'web',
            'notes' => $data['notes'] ?? null,
            'status' => 'open',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $record = DB::table('attendance_records')->where('id', $id)->first();

        return response()->json(['success' => true, 'data' => $record], 201);
    }

    public function clockOut(Request $request)
    {
        $data = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $institutionId = $this->institutionId();
        $userId = (int) auth()->id();

        $open = DB::table('attendance_records')
            ->where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->whereNull('clock_out_at')
            ->orderByDesc('clock_in_at')
            ->first();

        if (! $open) {
            return response()->json(['success' => false, 'data' => null, 'message' => 'No open attendance record found.'], 404);
        }

        DB::table('attendance_records')->where('id', $open->id)->update([
            'clock_out_at' => now(),
            'status' => 'closed',
            'notes' => $data['notes'] ?? $open->notes,
            'updated_at' => now(),
        ]);

        $record = DB::table('attendance_records')->where('id', $open->id)->first();

        return response()->json(['success' => true, 'data' => $record]);
    }

    public function myRecords(Request $request)
    {
        $institutionId = $this->institutionId();
        $userId = (int) auth()->id();

        $query = DB::table('attendance_records')
            ->where('institution_id', $institutionId)
            ->where('user_id', $userId)
            ->orderByDesc('clock_in_at');

        if ($request->filled('from')) {
            $query->whereDate('clock_in_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('clock_in_at', '<=', $request->input('to'));
        }

        return response()->json(['success' => true, 'data' => $query->paginate((int) $request->input('per_page', 20))]);
    }

    public function adminReport(Request $request)
    {
        $institutionId = $this->institutionId();

        $query = DB::table('attendance_records as ar')
            ->join('users as u', 'u.id', '=', 'ar.user_id')
            ->select('ar.*', 'u.name as user_name', 'u.email as user_email')
            ->where('ar.institution_id', $institutionId)
            ->orderByDesc('ar.clock_in_at');

        if ($request->filled('user_id')) {
            $query->where('ar.user_id', (int) $request->input('user_id'));
        }

        if ($request->filled('from')) {
            $query->whereDate('ar.clock_in_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('ar.clock_in_at', '<=', $request->input('to'));
        }

        return response()->json(['success' => true, 'data' => $query->paginate((int) $request->input('per_page', 20))]);
    }

    public function monthlySummary(Request $request)
    {
        $institutionId = $this->institutionId();
        $month = $request->input('month', now()->format('Y-m'));

        $monthExpr = \App\Support\SqlDialect::yearMonth('ar.clock_in_at');
        $minuteDiff = \App\Support\SqlDialect::minuteDiff('ar.clock_in_at', 'ar.clock_out_at');

        $summary = DB::table('attendance_records as ar')
            ->join('users as u', 'u.id', '=', 'ar.user_id')
            ->where('ar.institution_id', $institutionId)
            ->whereRaw("{$monthExpr} = ?", [$month])
            ->groupBy('ar.user_id', 'u.name')
            ->select(
                'ar.user_id',
                'u.name as user_name',
                DB::raw('COUNT(*) as attendance_days'),
                DB::raw("SUM(CASE WHEN ar.clock_out_at IS NOT NULL THEN {$minuteDiff} ELSE 0 END) as total_minutes")
            )
            ->get();

        return response()->json(['success' => true, 'data' => ['month' => $month, 'rows' => $summary]]);
    }
}
