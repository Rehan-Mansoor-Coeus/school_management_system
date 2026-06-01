<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColorTagToLetterCategoriesTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('letter_categories') && ! Schema::hasColumn('letter_categories', 'color_tag')) {
            Schema::table('letter_categories', function (Blueprint $table) {
                $table->string('color_tag', 20)->nullable()->after('description');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('letter_categories') && Schema::hasColumn('letter_categories', 'color_tag')) {
            Schema::table('letter_categories', function (Blueprint $table) {
                $table->dropColumn('color_tag');
            });
        }
    }
}
