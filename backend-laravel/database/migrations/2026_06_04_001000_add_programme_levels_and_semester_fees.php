<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddProgrammeLevelsAndSemesterFees extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('programme_levels')) {
            Schema::create('programme_levels', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('programme_id');
                $table->unsignedInteger('level_number')->default(100);
                $table->string('name');
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('programme_id')->references('id')->on('programmes')->onDelete('cascade');
                $table->unique(['programme_id', 'level_number']);
                $table->index('programme_id');
            });
        }

        if (Schema::hasTable('programme_semesters')) {
            Schema::table('programme_semesters', function (Blueprint $table) {
                if (! Schema::hasColumn('programme_semesters', 'programme_level_id')) {
                    $table->unsignedBigInteger('programme_level_id')->nullable()->after('programme_id');
                }
                if (! Schema::hasColumn('programme_semesters', 'total_semester_fee')) {
                    $table->decimal('total_semester_fee', 12, 2)->default(0)->after('name');
                }
                if (! Schema::hasColumn('programme_semesters', 'expected_payment_date')) {
                    $table->date('expected_payment_date')->nullable()->after('total_semester_fee');
                }
                if (! Schema::hasColumn('programme_semesters', 'latest_payment_date')) {
                    $table->date('latest_payment_date')->nullable()->after('expected_payment_date');
                }
            });

            if (Schema::hasTable('programme_levels')) {
                Schema::table('programme_semesters', function (Blueprint $table) {
                    if (Schema::hasColumn('programme_semesters', 'programme_level_id')) {
                        $table->foreign('programme_level_id')
                            ->references('id')
                            ->on('programme_levels')
                            ->onDelete('set null');
                    }
                });
            }
        }

        if (Schema::hasTable('fees')) {
            Schema::table('fees', function (Blueprint $table) {
                if (! Schema::hasColumn('fees', 'programme_id')) {
                    $table->unsignedBigInteger('programme_id')->nullable()->after('student_id');
                }
                if (! Schema::hasColumn('fees', 'programme_level_id')) {
                    $table->unsignedBigInteger('programme_level_id')->nullable()->after('programme_id');
                }
                if (! Schema::hasColumn('fees', 'programme_semester_id')) {
                    $table->unsignedBigInteger('programme_semester_id')->nullable()->after('programme_level_id');
                }
                if (! Schema::hasColumn('fees', 'latest_payment_date')) {
                    $table->date('latest_payment_date')->nullable()->after('due_date');
                }
                if (! Schema::hasColumn('fees', 'semester_name')) {
                    $table->string('semester_name')->nullable()->after('programme_semester_id');
                }
            });

            if (Schema::hasColumn('fees', 'status')) {
                DB::statement("ALTER TABLE fees MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending'");
            }
        }

        if (Schema::hasTable('programmes') && Schema::hasTable('programme_levels')) {
            $programmes = DB::table('programmes')->whereNull('deleted_at')->get(['id', 'duration_years', 'semester_count']);
            foreach ($programmes as $programme) {
                $existing = DB::table('programme_levels')->where('programme_id', $programme->id)->count();
                if ($existing > 0) {
                    continue;
                }

                $years = max(1, (int) $programme->duration_years);
                $levelIds = [];
                for ($i = 0; $i < $years; $i++) {
                    $levelNumber = 100 + ($i * 100);
                    $levelIds[] = DB::table('programme_levels')->insertGetId([
                        'programme_id' => $programme->id,
                        'level_number' => $levelNumber,
                        'name' => 'Level '.$levelNumber,
                        'sort_order' => $i + 1,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $semesters = DB::table('programme_semesters')
                    ->where('programme_id', $programme->id)
                    ->orderBy('semester_number')
                    ->get(['id', 'semester_number']);

                if ($semesters->isEmpty()) {
                    continue;
                }

                $perLevel = max(1, (int) ceil($semesters->count() / $years));
                foreach ($semesters as $index => $semester) {
                    $levelIndex = min((int) floor($index / $perLevel), count($levelIds) - 1);
                    DB::table('programme_semesters')
                        ->where('id', $semester->id)
                        ->update(['programme_level_id' => $levelIds[$levelIndex]]);
                }
            }
        }
    }

    public function down()
    {
        if (Schema::hasTable('programme_semesters')) {
            Schema::table('programme_semesters', function (Blueprint $table) {
                foreach (['programme_level_id', 'total_semester_fee', 'expected_payment_date', 'latest_payment_date'] as $column) {
                    if (Schema::hasColumn('programme_semesters', $column)) {
                        if ($column === 'programme_level_id') {
                            $table->dropForeign(['programme_level_id']);
                        }
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('fees')) {
            Schema::table('fees', function (Blueprint $table) {
                foreach (['programme_id', 'programme_level_id', 'programme_semester_id', 'latest_payment_date', 'semester_name'] as $column) {
                    if (Schema::hasColumn('fees', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        Schema::dropIfExists('programme_levels');
    }
}
