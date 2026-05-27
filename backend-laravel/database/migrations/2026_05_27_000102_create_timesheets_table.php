<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimesheetsTable extends Migration
{
    public function up()
    {
        Schema::create('timesheets', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('staff_id');
            $table->date('week_start_date');
            $table->date('week_end_date');
            $table->string('status', 30)->default('draft');
            $table->decimal('total_submitted_hours', 8, 2)->default(0);
            $table->decimal('total_expected_hours', 8, 2)->default(0);
            $table->decimal('overtime_hours', 8, 2)->default(0);
            $table->decimal('under_time_hours', 8, 2)->default(0);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('correction_reason')->nullable();
            $table->timestamps();

            $table->index('institution_id');
            $table->index(['institution_id', 'status']);
            $table->index(['institution_id', 'staff_id']);
            $table->unique(['institution_id', 'staff_id', 'week_start_date'], 'timesheets_staff_week_unique');
        });
    }

    public function down()
    {
        Schema::dropIfExists('timesheets');
    }
}
