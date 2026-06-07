<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPaymentProofFieldsToPaymentsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('payments')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'proof_path')) {
                $table->string('proof_path')->nullable()->after('description');
            }
            if (! Schema::hasColumn('payments', 'proof_notes')) {
                $table->text('proof_notes')->nullable()->after('proof_path');
            }
            if (! Schema::hasColumn('payments', 'reviewed_by')) {
                $table->unsignedBigInteger('reviewed_by')->nullable()->after('paid_at');
                $table->index('reviewed_by');
            }
            if (! Schema::hasColumn('payments', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            }
            if (! Schema::hasColumn('payments', 'review_notes')) {
                $table->text('review_notes')->nullable()->after('reviewed_at');
            }
        });

        if (Schema::hasColumn('payments', 'reviewed_by')) {
            try {
                Schema::table('payments', function (Blueprint $table) {
                    $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
                });
            } catch (\Exception $e) {
                // Foreign key may already exist.
            }
        }
    }

    public function down()
    {
        if (! Schema::hasTable('payments')) {
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'reviewed_by')) {
                try {
                    $table->dropForeign(['reviewed_by']);
                } catch (\Exception $e) {
                }
            }
            foreach (['review_notes', 'reviewed_at', 'reviewed_by', 'proof_notes', 'proof_path'] as $column) {
                if (Schema::hasColumn('payments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}
