<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateHrTasksAttendanceModuleTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('hr_institution_settings')) {
            Schema::create('hr_institution_settings', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->unique();
                $table->string('default_currency', 10)->default('UGX');
                $table->json('supported_currencies')->nullable();
                $table->string('staff_code_prefix', 40)->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('hr_staff_categories')) {
            Schema::create('hr_staff_categories', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('code', 50);
                $table->string('name', 120);
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->unique(['institution_id', 'code']);
            });
        }

        if (! Schema::hasTable('hr_position_rates')) {
            Schema::create('hr_position_rates', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('position', 120);
                $table->decimal('daily_rate', 12, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->unique(['institution_id', 'position']);
            });
        }

        if (! Schema::hasTable('hr_staff_profiles')) {
            Schema::create('hr_staff_profiles', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('staff_code', 40);
                $table->string('first_name', 120);
                $table->string('last_name', 120);
                $table->string('email')->nullable();
                $table->string('phone', 40)->nullable();
                $table->unsignedBigInteger('category_id');
                $table->string('position', 120)->nullable();
                $table->string('department', 120)->nullable();
                $table->string('payment_type', 20)->default('daily');
                $table->decimal('daily_rate', 12, 2)->nullable();
                $table->decimal('monthly_salary', 12, 2)->nullable();
                $table->date('contract_start')->nullable();
                $table->date('contract_end')->nullable();
                $table->date('hire_date')->nullable();
                $table->string('bank_name', 120)->nullable();
                $table->string('bank_account', 80)->nullable();
                $table->string('status', 20)->default('active');
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('category_id')->references('id')->on('hr_staff_categories')->onDelete('restrict');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
                $table->unique(['institution_id', 'staff_code']);
                $table->index(['institution_id', 'status']);
            });
        }

        if (! Schema::hasTable('hr_allowance_types')) {
            Schema::create('hr_allowance_types', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('code', 50);
                $table->string('name', 120);
                $table->decimal('default_amount', 12, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->unique(['institution_id', 'code']);
            });
        }

        if (! Schema::hasTable('hr_deduction_types')) {
            Schema::create('hr_deduction_types', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('code', 50);
                $table->string('name', 120);
                $table->decimal('default_amount', 12, 2)->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->unique(['institution_id', 'code']);
            });
        }

        if (! Schema::hasTable('hr_jobs')) {
            Schema::create('hr_jobs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('name');
                $table->string('client_name')->nullable();
                $table->string('location')->nullable();
                $table->text('description')->nullable();
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->string('status', 20)->default('draft');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
                $table->index(['institution_id', 'status']);
            });
        }

        if (! Schema::hasTable('hr_job_staff')) {
            Schema::create('hr_job_staff', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('job_id');
                $table->unsignedBigInteger('staff_profile_id');
                $table->decimal('daily_rate', 12, 2)->default(0);
                $table->decimal('days_worked', 6, 2)->default(0);
                $table->string('day_status', 20)->default('full');
                $table->decimal('partial_fraction', 4, 2)->default(1);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('job_id')->references('id')->on('hr_jobs')->onDelete('cascade');
                $table->foreign('staff_profile_id')->references('id')->on('hr_staff_profiles')->onDelete('cascade');
                $table->unique(['job_id', 'staff_profile_id']);
            });
        }

        if (! Schema::hasTable('hr_payroll_runs')) {
            Schema::create('hr_payroll_runs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('run_type', 20);
                $table->string('title');
                $table->unsignedBigInteger('job_id')->nullable();
                $table->date('period_start')->nullable();
                $table->date('period_end')->nullable();
                $table->string('currency', 10)->default('UGX');
                $table->string('status', 30)->default('draft');
                $table->decimal('total_gross', 14, 2)->default(0);
                $table->decimal('total_net', 14, 2)->default(0);
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('reviewed_by')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('forwarded_to_finance_at')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('job_id')->references('id')->on('hr_jobs')->onDelete('set null');
                $table->index(['institution_id', 'status']);
            });
        }

        if (! Schema::hasTable('hr_payroll_items')) {
            Schema::create('hr_payroll_items', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('payroll_run_id');
                $table->unsignedBigInteger('staff_profile_id');
                $table->decimal('basic_amount', 12, 2)->default(0);
                $table->decimal('daily_rate', 12, 2)->nullable();
                $table->decimal('days_worked', 6, 2)->nullable();
                $table->decimal('hours_expected', 8, 2)->nullable();
                $table->decimal('hours_actual', 8, 2)->nullable();
                $table->decimal('overtime_hours', 8, 2)->nullable();
                $table->decimal('gross_amount', 12, 2)->default(0);
                $table->decimal('total_allowances', 12, 2)->default(0);
                $table->decimal('total_deductions', 12, 2)->default(0);
                $table->decimal('total_advances', 12, 2)->default(0);
                $table->decimal('net_amount', 12, 2)->default(0);
                $table->string('payment_status', 30)->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('payroll_run_id')->references('id')->on('hr_payroll_runs')->onDelete('cascade');
                $table->foreign('staff_profile_id')->references('id')->on('hr_staff_profiles')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('hr_payroll_allowances')) {
            Schema::create('hr_payroll_allowances', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('payroll_item_id');
                $table->unsignedBigInteger('allowance_type_id')->nullable();
                $table->string('label', 120);
                $table->decimal('amount', 12, 2)->default(0);
                $table->timestamps();

                $table->foreign('payroll_item_id')->references('id')->on('hr_payroll_items')->onDelete('cascade');
                $table->foreign('allowance_type_id')->references('id')->on('hr_allowance_types')->onDelete('set null');
            });
        }

        if (! Schema::hasTable('hr_payroll_deductions')) {
            Schema::create('hr_payroll_deductions', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('payroll_item_id');
                $table->unsignedBigInteger('deduction_type_id')->nullable();
                $table->string('label', 120);
                $table->decimal('amount', 12, 2)->default(0);
                $table->timestamps();

                $table->foreign('payroll_item_id')->references('id')->on('hr_payroll_items')->onDelete('cascade');
                $table->foreign('deduction_type_id')->references('id')->on('hr_deduction_types')->onDelete('set null');
            });
        }

        if (! Schema::hasTable('hr_advance_payments')) {
            Schema::create('hr_advance_payments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('staff_profile_id');
                $table->unsignedBigInteger('job_id')->nullable();
                $table->unsignedBigInteger('payroll_item_id')->nullable();
                $table->decimal('amount', 12, 2)->default(0);
                $table->date('paid_date');
                $table->text('reason')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->decimal('balance_remaining', 12, 2)->default(0);
                $table->string('status', 20)->default('open');
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('staff_profile_id')->references('id')->on('hr_staff_profiles')->onDelete('cascade');
                $table->foreign('job_id')->references('id')->on('hr_jobs')->onDelete('set null');
            });
        }

        if (! Schema::hasTable('hr_payslips')) {
            Schema::create('hr_payslips', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('payroll_item_id')->unique();
                $table->string('verification_code', 32)->unique();
                $table->string('pdf_path', 500)->nullable();
                $table->timestamp('sent_email_at')->nullable();
                $table->timestamp('sent_whatsapp_at')->nullable();
                $table->timestamp('generated_at')->useCurrent();

                $table->foreign('payroll_item_id')->references('id')->on('hr_payroll_items')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('hr_payroll_approvals')) {
            Schema::create('hr_payroll_approvals', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('payroll_run_id');
                $table->string('stage', 30);
                $table->unsignedBigInteger('action_by')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('payroll_run_id')->references('id')->on('hr_payroll_runs')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('hr_finance_payments')) {
            Schema::create('hr_finance_payments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('payroll_run_id')->nullable();
                $table->unsignedBigInteger('payroll_item_id')->nullable();
                $table->decimal('amount', 12, 2)->default(0);
                $table->string('status', 30)->default('pending');
                $table->timestamp('paid_at')->nullable();
                $table->unsignedBigInteger('paid_by')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('hr_timesheet_entries')) {
            Schema::create('hr_timesheet_entries', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('staff_profile_id');
                $table->unsignedBigInteger('job_id')->nullable();
                $table->date('entry_date');
                $table->decimal('hours_worked', 6, 2)->default(0);
                $table->decimal('day_fraction', 4, 2)->default(1);
                $table->string('status', 20)->default('draft');
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('confirmed_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('staff_profile_id')->references('id')->on('hr_staff_profiles')->onDelete('cascade');
                $table->foreign('job_id')->references('id')->on('hr_jobs')->onDelete('set null');
                $table->unique(['staff_profile_id', 'entry_date', 'job_id'], 'hr_timesheet_staff_date_job_unique');
            });
        }

        if (! Schema::hasTable('hr_letter_templates')) {
            Schema::create('hr_letter_templates', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('letter_type', 40);
                $table->string('name');
                $table->string('subject', 500);
                $table->text('body');
                $table->boolean('is_default')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('hr_letters')) {
            Schema::create('hr_letters', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('template_id')->nullable();
                $table->unsignedBigInteger('staff_profile_id');
                $table->string('letter_type', 40);
                $table->string('subject', 500);
                $table->text('body');
                $table->string('reference_code', 32)->unique();
                $table->string('status', 20)->default('draft');
                $table->timestamp('sent_whatsapp_at')->nullable();
                $table->timestamp('sent_email_at')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('staff_profile_id')->references('id')->on('hr_staff_profiles')->onDelete('cascade');
            });
        }

        // Task Manager
        if (! Schema::hasTable('task_categories')) {
            Schema::create('task_categories', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('name');
                $table->text('description')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('task_message_templates')) {
            Schema::create('task_message_templates', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('name');
                $table->string('subject')->nullable();
                $table->text('body')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('tasks')) {
            Schema::create('tasks', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('priority', 50)->default('Medium');
                $table->date('start_date')->nullable();
                $table->string('start_time', 10)->nullable();
                $table->date('deadline')->nullable();
                $table->string('deadline_time', 10)->nullable();
                $table->string('status', 50)->default('Pending');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('category_id')->nullable();
                $table->text('notification_template')->nullable();
                $table->json('schedules_json')->nullable();
                $table->boolean('is_scheduled')->default(false);
                $table->string('color', 20)->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('category_id')->references('id')->on('task_categories')->onDelete('set null');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
                $table->index(['institution_id', 'status']);
            });
        }

        if (! Schema::hasTable('task_assignments')) {
            Schema::create('task_assignments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('task_id');
                $table->unsignedBigInteger('user_id');
                $table->string('status', 50)->default('Pending');
                $table->unsignedTinyInteger('progress')->default(0);
                $table->timestamp('accepted_at')->nullable();
                $table->timestamp('declined_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamp('last_update_at')->nullable();
                $table->string('invite_token', 64)->nullable()->unique();
                $table->timestamps();

                $table->foreign('task_id')->references('id')->on('tasks')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->unique(['task_id', 'user_id']);
            });
        }

        if (! Schema::hasTable('task_updates')) {
            Schema::create('task_updates', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('assignment_id');
                $table->unsignedTinyInteger('progress')->default(0);
                $table->text('comment')->nullable();
                $table->timestamps();

                $table->foreign('assignment_id')->references('id')->on('task_assignments')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('task_attachments')) {
            Schema::create('task_attachments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('task_id');
                $table->unsignedBigInteger('update_id')->nullable();
                $table->string('file_name');
                $table->text('file_url');
                $table->string('attachment_type', 50)->nullable();
                $table->timestamps();

                $table->foreign('task_id')->references('id')->on('tasks')->onDelete('cascade');
                $table->foreign('update_id')->references('id')->on('task_updates')->onDelete('set null');
            });
        }

        if (! Schema::hasTable('task_reminders')) {
            Schema::create('task_reminders', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('task_id');
                $table->timestamp('reminder_time');
                $table->boolean('is_sent')->default(false);
                $table->timestamps();

                $table->foreign('task_id')->references('id')->on('tasks')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('task_notification_queue')) {
            Schema::create('task_notification_queue', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('task_id');
                $table->unsignedBigInteger('assignment_id');
                $table->timestamp('scheduled_at');
                $table->string('status', 50)->default('pending');
                $table->timestamp('sent_at')->nullable();
                $table->text('last_error')->nullable();
                $table->timestamps();

                $table->foreign('task_id')->references('id')->on('tasks')->onDelete('cascade');
                $table->foreign('assignment_id')->references('id')->on('task_assignments')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('task_cc')) {
            Schema::create('task_cc', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('task_id');
                $table->unsignedBigInteger('user_id');
                $table->timestamps();

                $table->foreign('task_id')->references('id')->on('tasks')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->unique(['task_id', 'user_id']);
            });
        }

        // Time & Attendance (clock records — complements existing timesheets module)
        if (! Schema::hasTable('attendance_records')) {
            Schema::create('attendance_records', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('user_id');
                $table->timestamp('clock_in_at');
                $table->timestamp('clock_out_at')->nullable();
                $table->string('source', 30)->default('web');
                $table->text('notes')->nullable();
                $table->string('status', 20)->default('open');
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->index(['institution_id', 'user_id', 'clock_in_at']);
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('task_cc');
        Schema::dropIfExists('task_notification_queue');
        Schema::dropIfExists('task_reminders');
        Schema::dropIfExists('task_attachments');
        Schema::dropIfExists('task_updates');
        Schema::dropIfExists('task_assignments');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('task_message_templates');
        Schema::dropIfExists('task_categories');
        Schema::dropIfExists('hr_letters');
        Schema::dropIfExists('hr_letter_templates');
        Schema::dropIfExists('hr_timesheet_entries');
        Schema::dropIfExists('hr_finance_payments');
        Schema::dropIfExists('hr_payroll_approvals');
        Schema::dropIfExists('hr_payslips');
        Schema::dropIfExists('hr_advance_payments');
        Schema::dropIfExists('hr_payroll_deductions');
        Schema::dropIfExists('hr_payroll_allowances');
        Schema::dropIfExists('hr_payroll_items');
        Schema::dropIfExists('hr_payroll_runs');
        Schema::dropIfExists('hr_job_staff');
        Schema::dropIfExists('hr_jobs');
        Schema::dropIfExists('hr_deduction_types');
        Schema::dropIfExists('hr_allowance_types');
        Schema::dropIfExists('hr_staff_profiles');
        Schema::dropIfExists('hr_position_rates');
        Schema::dropIfExists('hr_staff_categories');
        Schema::dropIfExists('hr_institution_settings');
    }
}
