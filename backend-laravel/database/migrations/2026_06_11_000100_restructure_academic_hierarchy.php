<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RestructureAcademicHierarchy extends Migration
{
    public function up()
    {
        Schema::create('academic_units', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->string('name');
            $table->string('unit_type');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->index(['institution_id', 'is_active']);
        });

        Schema::table('departments', function (Blueprint $table) {
            if (! Schema::hasColumn('departments', 'academic_unit_id')) {
                $table->unsignedBigInteger('academic_unit_id')->nullable()->after('institution_id');
                $table->foreign('academic_unit_id')->references('id')->on('academic_units')->onDelete('set null');
            }
        });

        Schema::table('programmes', function (Blueprint $table) {
            if (! Schema::hasColumn('programmes', 'academic_unit_id')) {
                $table->unsignedBigInteger('academic_unit_id')->nullable()->after('department_id');
                $table->foreign('academic_unit_id')->references('id')->on('academic_units')->onDelete('set null');
            }
            if (! Schema::hasColumn('programmes', 'duration_value')) {
                $table->unsignedInteger('duration_value')->nullable()->after('duration_years');
            }
            if (! Schema::hasColumn('programmes', 'duration_unit')) {
                $table->string('duration_unit', 20)->nullable()->after('duration_value');
            }
        });

        Schema::table('programme_semesters', function (Blueprint $table) {
            if (! Schema::hasColumn('programme_semesters', 'start_date')) {
                $table->date('start_date')->nullable()->after('name');
            }
            if (! Schema::hasColumn('programme_semesters', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
            if (! Schema::hasColumn('programme_semesters', 'academic_year')) {
                $table->string('academic_year', 20)->nullable()->after('end_date');
            }
        });

        Schema::table('subjects', function (Blueprint $table) {
            if (! Schema::hasColumn('subjects', 'credit_hours')) {
                $table->decimal('credit_hours', 5, 2)->nullable()->after('code');
            }
        });

        Schema::create('program_subjects', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('institution_id');
            $table->unsignedBigInteger('programme_id');
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('programme_semester_id')->nullable();
            $table->decimal('credit_hours_override', 5, 2)->nullable();
            $table->integer('contact_hours_override')->nullable();
            $table->boolean('is_required')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            $table->foreign('programme_id')->references('id')->on('programmes')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('programme_semester_id')->references('id')->on('programme_semesters')->onDelete('set null');
            $table->unique(['programme_id', 'subject_id', 'programme_semester_id'], 'program_subject_unique');
            $table->index(['institution_id', 'programme_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('program_subjects');

        Schema::table('subjects', function (Blueprint $table) {
            if (Schema::hasColumn('subjects', 'credit_hours')) {
                $table->dropColumn('credit_hours');
            }
        });

        Schema::table('programme_semesters', function (Blueprint $table) {
            foreach (['academic_year', 'end_date', 'start_date'] as $col) {
                if (Schema::hasColumn('programme_semesters', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('programmes', function (Blueprint $table) {
            if (Schema::hasColumn('programmes', 'academic_unit_id')) {
                $table->dropForeign(['academic_unit_id']);
                $table->dropColumn('academic_unit_id');
            }
            foreach (['duration_unit', 'duration_value'] as $col) {
                if (Schema::hasColumn('programmes', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'academic_unit_id')) {
                $table->dropForeign(['academic_unit_id']);
                $table->dropColumn('academic_unit_id');
            }
        });

        Schema::dropIfExists('academic_units');
    }
}
