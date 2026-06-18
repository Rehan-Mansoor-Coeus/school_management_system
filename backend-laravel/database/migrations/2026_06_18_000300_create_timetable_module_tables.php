<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimetableModuleTables extends Migration
{
    public function up()
    {
        // Classrooms / teaching spaces
        if (! Schema::hasTable('tt_classrooms')) {
            Schema::create('tt_classrooms', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('name');
                $table->string('building')->nullable();
                $table->unsignedInteger('capacity')->default(0);
                $table->enum('room_type', ['lecture_hall', 'laboratory', 'workshop', 'computer_lab', 'seminar_room'])->default('lecture_hall');
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();
                $table->unique(['institution_id', 'name']);
                $table->index(['institution_id', 'is_active']);
            });
        }

        // Courses (academic course allocation catalog for timetabling)
        if (! Schema::hasTable('tt_courses')) {
            Schema::create('tt_courses', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('subject_id')->nullable();
                $table->unsignedBigInteger('department_id')->nullable();
                $table->unsignedBigInteger('programme_id')->nullable();
                $table->unsignedBigInteger('programme_semester_id')->nullable();
                $table->string('semester_label')->nullable();
                $table->string('code');
                $table->string('name');
                $table->decimal('credit_hours', 6, 2)->default(0);
                $table->unsignedInteger('contact_hours')->default(0);
                $table->unsignedInteger('practical_hours')->default(0);
                $table->unsignedInteger('laboratory_hours')->default(0);
                $table->string('level')->nullable();
                $table->boolean('is_active')->default(true);
                $table->text('description')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();
                $table->unique(['institution_id', 'code']);
                $table->index(['institution_id', 'department_id']);
                $table->index(['institution_id', 'programme_id']);
            });
        }

        // Course assignments (teacher/classroom/programme/semester + expected contact hours)
        if (! Schema::hasTable('tt_course_assignments')) {
            Schema::create('tt_course_assignments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('course_id');
                $table->unsignedBigInteger('teacher_id');
                $table->unsignedBigInteger('classroom_id')->nullable();
                $table->unsignedBigInteger('programme_id')->nullable();
                $table->unsignedBigInteger('programme_semester_id')->nullable();
                $table->string('academic_year')->nullable();
                $table->unsignedInteger('expected_contact_hours')->default(0);
                $table->decimal('completed_contact_hours', 8, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->index(['institution_id', 'course_id']);
                $table->index(['institution_id', 'teacher_id']);
            });
        }

        // Teacher availability per weekday (1=Mon .. 7=Sun)
        if (! Schema::hasTable('tt_teacher_availability')) {
            Schema::create('tt_teacher_availability', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('teacher_id');
                $table->unsignedTinyInteger('day_of_week');
                $table->boolean('is_available')->default(true);
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->timestamps();
                $table->unique(['teacher_id', 'day_of_week']);
                $table->index(['institution_id', 'teacher_id']);
            });
        }

        // Timetable entries (the scheduled slots)
        if (! Schema::hasTable('tt_timetable_entries')) {
            Schema::create('tt_timetable_entries', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('department_id')->nullable();
                $table->unsignedBigInteger('programme_id')->nullable();
                $table->unsignedBigInteger('programme_semester_id')->nullable();
                $table->string('academic_year')->nullable();
                $table->unsignedBigInteger('course_id');
                $table->unsignedBigInteger('teacher_id')->nullable();
                $table->unsignedBigInteger('classroom_id')->nullable();
                $table->unsignedBigInteger('assignment_id')->nullable();
                $table->unsignedTinyInteger('day_of_week');
                $table->time('start_time');
                $table->time('end_time');
                $table->enum('source', ['manual', 'auto'])->default('manual');
                $table->enum('status', ['draft', 'approved', 'published'])->default('draft');
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();
                $table->index(['institution_id', 'teacher_id', 'day_of_week']);
                $table->index(['institution_id', 'classroom_id', 'day_of_week']);
                $table->index(['institution_id', 'programme_semester_id', 'day_of_week']);
            });
        }

        // Teacher lesson logs (accumulate contact hours)
        if (! Schema::hasTable('tt_lesson_logs')) {
            Schema::create('tt_lesson_logs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('course_id');
                $table->unsignedBigInteger('assignment_id')->nullable();
                $table->unsignedBigInteger('timetable_entry_id')->nullable();
                $table->unsignedBigInteger('teacher_id');
                $table->unsignedBigInteger('programme_semester_id')->nullable();
                $table->date('lesson_date');
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->decimal('duration_hours', 6, 2)->default(0);
                $table->string('topic');
                $table->text('remarks')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->index(['institution_id', 'course_id']);
                $table->index(['institution_id', 'teacher_id']);
                $table->index(['institution_id', 'lesson_date']);
            });
        }

        // Per-institution timetable settings (workload limits, working hours)
        if (! Schema::hasTable('tt_settings')) {
            Schema::create('tt_settings', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->unique();
                $table->unsignedInteger('max_weekly_teaching_hours')->default(18);
                $table->unsignedInteger('default_lesson_minutes')->default(60);
                $table->unsignedInteger('weeks_per_semester')->default(15);
                $table->time('day_start_time')->default('08:00:00');
                $table->time('day_end_time')->default('17:00:00');
                $table->json('working_days')->nullable();
                $table->boolean('require_dean_approval')->default(false);
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('tt_lesson_logs');
        Schema::dropIfExists('tt_timetable_entries');
        Schema::dropIfExists('tt_teacher_availability');
        Schema::dropIfExists('tt_course_assignments');
        Schema::dropIfExists('tt_courses');
        Schema::dropIfExists('tt_classrooms');
        Schema::dropIfExists('tt_settings');
    }
}
