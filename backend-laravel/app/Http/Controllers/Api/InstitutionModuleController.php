<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Institution;
use App\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InstitutionModuleController extends Controller
{
    public function show(Institution $institution)
    {
        $modules = Module::query()
            ->select(['modules.id', 'modules.key', 'modules.name', 'modules.description', 'modules.sort_order', 'modules.is_active'])
            ->leftJoin('institution_modules', function ($join) use ($institution) {
                $join->on('institution_modules.module_id', '=', 'modules.id')
                    ->where('institution_modules.institution_id', '=', $institution->id);
            })
            ->addSelect(DB::raw('COALESCE(institution_modules.enabled, 0) as enabled'))
            ->orderBy('modules.sort_order')
            ->orderBy('modules.name')
            ->get();

        return response()->json([
            'institution' => $institution->only(['id', 'name', 'code']),
            'modules' => $modules,
        ]);
    }

    public function update(Request $request, Institution $institution)
    {
        $validator = Validator::make($request->all(), [
            'modules' => 'required|array|min:1',
            'modules.*.key' => 'required|string|exists:modules,key',
            'modules.*.enabled' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $keyToEnabled = collect($request->modules)->mapWithKeys(function ($row) {
            return [$row['key'] => (bool) $row['enabled']];
        });

        $modules = Module::whereIn('key', $keyToEnabled->keys())->get(['id', 'key']);

        foreach ($modules as $module) {
            DB::table('institution_modules')->updateOrInsert(
                ['institution_id' => $institution->id, 'module_id' => $module->id],
                ['enabled' => $keyToEnabled[$module->key], 'updated_at' => now(), 'created_at' => now()]
            );
        }

        return response()->json(['message' => 'Institution modules updated successfully.']);
    }
}

