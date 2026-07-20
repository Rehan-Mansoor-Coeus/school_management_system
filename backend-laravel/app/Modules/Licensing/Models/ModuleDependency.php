<?php

namespace App\Modules\Licensing\Models;

use App\Module;
use Illuminate\Database\Eloquent\Model;

class ModuleDependency extends Model
{
    protected $fillable = [
        'module_id',
        'depends_on_module_id',
        'is_required',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class, 'module_id');
    }

    public function dependsOn()
    {
        return $this->belongsTo(Module::class, 'depends_on_module_id');
    }
}
