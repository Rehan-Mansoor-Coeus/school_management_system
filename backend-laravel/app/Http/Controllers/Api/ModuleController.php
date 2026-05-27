<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Institution;
use App\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ModuleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $institutionId = $user->institution_id;
        if ($request->filled('institution_id') && $user->can('modules.manage')) {
            $institutionId = (int) $request->institution_id;
        }

        if (! $institutionId) {
            return response()->json(['message' => 'Institution not set for this user.'], 403);
        }

        $modules = Module::query()
            ->select(['modules.id', 'modules.key', 'modules.name', 'modules.description', 'modules.sort_order', 'modules.is_active'])
            ->leftJoin('institution_modules', function ($join) use ($institutionId) {
                $join->on('institution_modules.module_id', '=', 'modules.id')
                    ->where('institution_modules.institution_id', '=', $institutionId);
            })
            ->addSelect(DB::raw('COALESCE(institution_modules.enabled, 0) as enabled'))
            ->orderBy('modules.sort_order')
            ->orderBy('modules.name')
            ->get();

        return response()->json([
            'institution_id' => $institutionId,
            'modules' => $modules,
        ]);
    }
}

