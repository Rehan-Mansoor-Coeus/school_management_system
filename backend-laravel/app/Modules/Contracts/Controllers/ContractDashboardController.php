<?php

namespace App\Modules\Contracts\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Contracts\Concerns\ResolvesInstitution;
use App\Modules\Contracts\Services\ContractDashboardService;

class ContractDashboardController extends Controller
{
    use ResolvesInstitution;

    protected $service;

    public function __construct(ContractDashboardService $service)
    {
        $this->service = $service;
    }

    public function stats()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $this->service->stats($this->institutionId()),
                'charts' => $this->service->charts($this->institutionId()),
            ],
        ]);
    }
}
