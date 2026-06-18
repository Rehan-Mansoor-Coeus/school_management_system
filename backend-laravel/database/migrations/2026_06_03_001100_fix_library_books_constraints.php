<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fix legacy library_books constraints from the old stub migration:
 * - Drop global ISBN unique (wrong for multi-institution; blocks re-register attempts)
 * - Add per-institution ISBN unique instead
 */
class FixLibraryBooksConstraints extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_books')) {
            return;
        }

        $this->dropIndexIfExists('library_books', 'library_books_isbn_unique');
        $this->dropIndexIfExists('library_books', 'library_books_call_number_unique');

        $hasCompound = collect(DB::select("SHOW INDEX FROM library_books WHERE Key_name = 'library_books_institution_isbn_unique'"))->isNotEmpty();

        if (! $hasCompound && Schema::hasColumn('library_books', 'isbn') && Schema::hasColumn('library_books', 'institution_id')) {
            Schema::table('library_books', function (Blueprint $table) {
                $table->unique(['institution_id', 'isbn'], 'library_books_institution_isbn_unique');
            });
        }
    }

    public function down()
    {
        // Non-destructive; leave indexes in place on rollback.
    }

    protected function dropIndexIfExists(string $table, string $indexName): void
    {
        $exists = collect(DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]))->isNotEmpty();
        if ($exists) {
            DB::statement("ALTER TABLE {$table} DROP INDEX {$indexName}");
        }
    }
}
