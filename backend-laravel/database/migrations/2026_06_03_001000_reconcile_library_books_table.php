<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Reconciles a pre-existing (stub) library_books table with the columns the
 * Library Management module needs. Purely additive / constraint-relaxing — it
 * never drops columns or data, and is guarded by Schema::hasColumn().
 */
class ReconcileLibraryBooksTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('library_books')) {
            return;
        }

        Schema::table('library_books', function (Blueprint $table) {
            if (! Schema::hasColumn('library_books', 'category_id')) {
                $table->unsignedBigInteger('category_id')->nullable()->after('institution_id')->index();
            }
            if (! Schema::hasColumn('library_books', 'cover_image_path')) {
                $table->string('cover_image_path')->nullable();
            }
            if (! Schema::hasColumn('library_books', 'language')) {
                $table->string('language')->nullable();
            }
            if (! Schema::hasColumn('library_books', 'shelf_location')) {
                $table->string('shelf_location')->nullable();
            }
            if (! Schema::hasColumn('library_books', 'status')) {
                $table->string('status')->default('active')->index();
            }
            if (! Schema::hasColumn('library_books', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable();
            }
        });

        // Relax legacy NOT NULL constraints that the new module does not populate.
        $this->makeNullable('author', 'VARCHAR(255)');
        $this->makeNullable('call_number', 'VARCHAR(255)');

        // Keep status in sync with the legacy is_active flag where present.
        if (Schema::hasColumn('library_books', 'is_active') && Schema::hasColumn('library_books', 'status')) {
            DB::table('library_books')->where('is_active', false)->update(['status' => 'inactive']);
            DB::table('library_books')->where('is_active', true)->update(['status' => 'active']);
        }
    }

    public function down()
    {
        // Non-destructive migration; nothing to roll back safely.
    }

    protected function makeNullable(string $column, string $type): void
    {
        if (! Schema::hasColumn('library_books', $column)) {
            return;
        }

        try {
            DB::statement("ALTER TABLE library_books MODIFY {$column} {$type} NULL");
        } catch (\Throwable $e) {
            // Ignore if the database driver does not support the change.
        }
    }
}
