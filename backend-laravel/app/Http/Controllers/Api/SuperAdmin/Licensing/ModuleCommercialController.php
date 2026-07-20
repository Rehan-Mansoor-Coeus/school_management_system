<?php

namespace App\Http\Controllers\Api\SuperAdmin\Licensing;

use App\Http\Controllers\Controller;
use App\Module;
use App\Modules\Licensing\Models\ModuleDependency;
use App\Support\PlatformAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class ModuleCommercialController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (! PlatformAccess::isPlatformSuperAdmin($request->user())) {
                abort(403, 'Only platform super administrators can manage module pricing.');
            }

            return $next($request);
        });
    }

    public function index()
    {
        $modules = Module::query()->orderBy('sort_order')->orderBy('name')->get();
        $deps = Schema::hasTable('module_dependencies')
            ? ModuleDependency::query()->get()->groupBy('module_id')
            : collect();

        return response()->json([
            'data' => $modules->map(function (Module $module) use ($deps) {
                $moduleDeps = $deps->get($module->id, collect());

                return [
                    'id' => $module->id,
                    'key' => $module->key,
                    'name' => $module->name,
                    'description' => $module->description,
                    'is_active' => (bool) $module->is_active,
                    'monthly_price' => $module->monthly_price,
                    'quarterly_price' => $module->quarterly_price,
                    'six_month_price' => $module->six_month_price,
                    'yearly_price' => $module->yearly_price,
                    'one_time_price' => $module->one_time_price,
                    'setup_fee' => $module->setup_fee,
                    'is_free' => (bool) $module->is_free,
                    'is_mandatory' => (bool) $module->is_mandatory,
                    'can_purchase_separately' => (bool) $module->can_purchase_separately,
                    'trial_available' => (bool) $module->trial_available,
                    'depends_on_module_ids' => $moduleDeps->pluck('depends_on_module_id')->values()->all(),
                ];
            })->values(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $module = Module::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'monthly_price' => 'nullable|numeric|min:0',
            'quarterly_price' => 'nullable|numeric|min:0',
            'six_month_price' => 'nullable|numeric|min:0',
            'yearly_price' => 'nullable|numeric|min:0',
            'one_time_price' => 'nullable|numeric|min:0',
            'setup_fee' => 'nullable|numeric|min:0',
            'is_free' => 'nullable|boolean',
            'is_mandatory' => 'nullable|boolean',
            'can_purchase_separately' => 'nullable|boolean',
            'trial_available' => 'nullable|boolean',
            'depends_on_module_ids' => 'nullable|array',
            'depends_on_module_ids.*' => 'integer|exists:modules,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $dependsOn = $data['depends_on_module_ids'] ?? null;
        unset($data['depends_on_module_ids']);

        DB::transaction(function () use ($module, $data, $dependsOn) {
            $module->update($data);

            if (is_array($dependsOn) && Schema::hasTable('module_dependencies')) {
                ModuleDependency::where('module_id', $module->id)->delete();
                foreach ($dependsOn as $depId) {
                    if ((int) $depId === (int) $module->id) {
                        continue;
                    }
                    ModuleDependency::create([
                        'module_id' => $module->id,
                        'depends_on_module_id' => (int) $depId,
                        'is_required' => true,
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Module pricing updated.',
            'data' => $module->fresh(),
        ]);
    }
}
