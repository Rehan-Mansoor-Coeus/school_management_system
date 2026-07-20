<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Phase2ModuleDependenciesAndAdjustments extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('module_dependencies')) {
            Schema::create('module_dependencies', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('module_id');
                $table->unsignedBigInteger('depends_on_module_id');
                $table->boolean('is_required')->default(true);
                $table->timestamps();

                $table->unique(['module_id', 'depends_on_module_id'], 'module_dep_unique');
                $table->foreign('module_id')->references('id')->on('modules')->onDelete('cascade');
                $table->foreign('depends_on_module_id')->references('id')->on('modules')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('license_adjustments')) {
            Schema::create('license_adjustments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_license_id');
                $table->string('adjustment_type', 60);
                $table->decimal('amount', 15, 2)->default(0);
                $table->string('currency', 10)->default('XAF');
                $table->text('reason')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_license_id', 'la_license_fk')
                    ->references('id')->on('institution_licenses')->onDelete('cascade');
                $table->index(['institution_license_id', 'adjustment_type']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('license_adjustments');
        Schema::dropIfExists('module_dependencies');
    }
}
