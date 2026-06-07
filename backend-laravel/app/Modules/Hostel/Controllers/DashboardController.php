<?php

namespace App\Modules\Hostel\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hostel\Concerns\ResolvesInstitution;
use App\Modules\Hostel\Models\Hostel;
use App\Modules\Hostel\Models\HostelAllocation;
use App\Modules\Hostel\Models\HostelRegistration;
use App\Modules\Hostel\Models\HostelRoom;
use App\Modules\Hostel\Services\HostelAllocationService;
use Illuminate\Http\Request;

class DashboardController extends Controller
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

        $hostels = Hostel::where('institution_id', $institutionId)->get();
        $rooms = HostelRoom::where('institution_id', $institutionId)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'hostels_count' => $hostels->count(),
                'active_hostels' => $hostels->where('is_active', true)->count(),
                'total_capacity' => $rooms->sum('capacity'),
                'occupied_beds' => $rooms->sum('occupied_beds'),
                'available_beds' => max(0, $rooms->sum('capacity') - $rooms->sum('occupied_beds')),
                'pending_registrations' => HostelRegistration::where('institution_id', $institutionId)->where('status', 'pending')->count(),
                'active_allocations' => HostelAllocation::where('institution_id', $institutionId)->whereIn('status', ['allocated', 'active'])->count(),
                'occupancy_rate' => $rooms->sum('capacity') > 0
                    ? round(($rooms->sum('occupied_beds') / $rooms->sum('capacity')) * 100, 1)
                    : 0,
            ],
        ]);
    }
}
