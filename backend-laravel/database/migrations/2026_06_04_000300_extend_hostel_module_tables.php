<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ExtendHostelModuleTables extends Migration
{
    public function up()
    {
        if (Schema::hasTable('rooms')) {
            try {
                Schema::table('rooms', function (Blueprint $table) {
                    $table->dropUnique(['room_number']);
                });
            } catch (\Exception $e) {
                // Index may already be dropped or named differently.
            }

            try {
                Schema::table('rooms', function (Blueprint $table) {
                    $table->unique(['hostel_id', 'room_number']);
                });
            } catch (\Exception $e) {
                // Composite unique may already exist.
            }
        }

        if (Schema::hasTable('hostel_allocations') && ! Schema::hasColumn('hostel_allocations', 'bed_id')) {
            Schema::table('hostel_allocations', function (Blueprint $table) {
                $table->unsignedBigInteger('bed_id')->nullable()->after('room_id');
                $table->unsignedBigInteger('registration_id')->nullable()->after('academic_year_id');
                $table->index('bed_id');
                $table->index('registration_id');
            });
        }

        if (! Schema::hasTable('hostel_beds')) {
            Schema::create('hostel_beds', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('room_id');
                $table->string('bed_label', 20);
                $table->enum('status', ['available', 'occupied', 'maintenance'])->default('available');
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('room_id')->references('id')->on('rooms')->onDelete('cascade');
                $table->unique(['room_id', 'bed_label']);
                $table->index('institution_id');
                $table->index('status');
            });
        }

        if (! Schema::hasTable('hostel_registrations')) {
            Schema::create('hostel_registrations', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('student_id');
                $table->unsignedBigInteger('academic_year_id');
                $table->unsignedBigInteger('preferred_hostel_id')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected', 'allocated'])->default('pending');
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('reviewed_by')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
                $table->foreign('academic_year_id')->references('id')->on('academic_years')->onDelete('cascade');
                $table->foreign('preferred_hostel_id')->references('id')->on('hostels')->onDelete('set null');
                $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
                $table->unique(['student_id', 'academic_year_id']);
                $table->index('institution_id');
                $table->index('status');
            });
        }

        if (! Schema::hasTable('hostel_payments')) {
            Schema::create('hostel_payments', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('student_id');
                $table->unsignedBigInteger('allocation_id')->nullable();
                $table->string('reference')->unique();
                $table->decimal('amount', 12, 2);
                $table->decimal('amount_paid', 12, 2)->default(0);
                $table->enum('status', ['pending', 'partial', 'paid', 'waived'])->default('pending');
                $table->enum('payment_method', ['cash', 'bank_transfer', 'mobile_money', 'card', 'other'])->nullable();
                $table->string('payment_reference')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('recorded_by')->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
                $table->foreign('allocation_id')->references('id')->on('hostel_allocations')->onDelete('set null');
                $table->foreign('recorded_by')->references('id')->on('users')->onDelete('set null');
                $table->index('institution_id');
                $table->index('student_id');
                $table->index('status');
            });
        }

        if (! Schema::hasTable('hostel_clearances')) {
            Schema::create('hostel_clearances', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('allocation_id');
                $table->boolean('room_inspected')->default(false);
                $table->boolean('items_returned')->default(false);
                $table->boolean('fees_cleared')->default(false);
                $table->enum('status', ['pending', 'cleared', 'rejected'])->default('pending');
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('cleared_by')->nullable();
                $table->timestamp('cleared_at')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('allocation_id')->references('id')->on('hostel_allocations')->onDelete('cascade');
                $table->foreign('cleared_by')->references('id')->on('users')->onDelete('set null');
                $table->unique('allocation_id');
                $table->index('institution_id');
                $table->index('status');
            });
        }

        if (! Schema::hasTable('hostel_maintenance_requests')) {
            Schema::create('hostel_maintenance_requests', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id');
                $table->unsignedBigInteger('hostel_id');
                $table->unsignedBigInteger('room_id')->nullable();
                $table->unsignedBigInteger('bed_id')->nullable();
                $table->string('title');
                $table->text('description');
                $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
                $table->enum('status', ['open', 'in_progress', 'completed', 'cancelled'])->default('open');
                $table->unsignedBigInteger('reported_by')->nullable();
                $table->unsignedBigInteger('assigned_to')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();

                $table->foreign('institution_id')->references('id')->on('institutions')->onDelete('cascade');
                $table->foreign('hostel_id')->references('id')->on('hostels')->onDelete('cascade');
                $table->foreign('room_id')->references('id')->on('rooms')->onDelete('set null');
                $table->foreign('bed_id')->references('id')->on('hostel_beds')->onDelete('set null');
                $table->foreign('reported_by')->references('id')->on('users')->onDelete('set null');
                $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
                $table->index('institution_id');
                $table->index('hostel_id');
                $table->index('status');
            });
        }

        if (Schema::hasTable('hostel_allocations') && Schema::hasTable('hostel_beds') && Schema::hasColumn('hostel_allocations', 'bed_id')) {
            try {
                Schema::table('hostel_allocations', function (Blueprint $table) {
                    $table->foreign('bed_id')->references('id')->on('hostel_beds')->onDelete('set null');
                });
            } catch (\Exception $e) {
                // Foreign key may already exist.
            }
        }

        if (Schema::hasTable('hostel_allocations') && Schema::hasTable('hostel_registrations') && Schema::hasColumn('hostel_allocations', 'registration_id')) {
            try {
                Schema::table('hostel_allocations', function (Blueprint $table) {
                    $table->foreign('registration_id')->references('id')->on('hostel_registrations')->onDelete('set null');
                });
            } catch (\Exception $e) {
                // Foreign key may already exist.
            }
        }
    }

    public function down()
    {
        Schema::dropIfExists('hostel_maintenance_requests');
        Schema::dropIfExists('hostel_clearances');
        Schema::dropIfExists('hostel_payments');

        if (Schema::hasTable('hostel_allocations') && Schema::hasColumn('hostel_allocations', 'registration_id')) {
            try {
                Schema::table('hostel_allocations', function (Blueprint $table) {
                    $table->dropForeign(['registration_id']);
                });
            } catch (\Exception $e) {
            }
            Schema::table('hostel_allocations', function (Blueprint $table) {
                $table->dropColumn('registration_id');
            });
        }

        Schema::dropIfExists('hostel_registrations');

        if (Schema::hasTable('hostel_allocations') && Schema::hasColumn('hostel_allocations', 'bed_id')) {
            try {
                Schema::table('hostel_allocations', function (Blueprint $table) {
                    $table->dropForeign(['bed_id']);
                });
            } catch (\Exception $e) {
            }
            Schema::table('hostel_allocations', function (Blueprint $table) {
                $table->dropColumn('bed_id');
            });
        }

        Schema::dropIfExists('hostel_beds');
    }
}
