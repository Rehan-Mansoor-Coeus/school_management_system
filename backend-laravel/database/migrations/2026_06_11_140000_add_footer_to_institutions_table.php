<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFooterToInstitutionsTable extends Migration
{
    public function up()
    {
        Schema::table('institutions', function (Blueprint $table) {
            if (! Schema::hasColumn('institutions', 'footer')) {
                $table->string('footer')->nullable()->after('letterhead');
            }
        });

        if (Schema::hasColumn('institutions', 'footer') && Schema::hasColumn('institutions', 'official_stamp')) {
            \DB::table('institutions')
                ->whereNull('footer')
                ->whereNotNull('official_stamp')
                ->update(['footer' => \DB::raw('official_stamp')]);
        }
    }

    public function down()
    {
        Schema::table('institutions', function (Blueprint $table) {
            if (Schema::hasColumn('institutions', 'footer')) {
                $table->dropColumn('footer');
            }
        });
    }
}
