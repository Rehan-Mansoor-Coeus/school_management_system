<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGeneralSettingsAndLandingTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('general_settings')) {
            Schema::create('general_settings', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->decimal('student_registration_fee', 12, 2)->default(2.00);
                $table->string('registration_fee_currency', 10)->default('USD');
                $table->string('registration_fee_period')->default('per_semester');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('institution_registration_requests')) {
            Schema::create('institution_registration_requests', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('institution_name');
                $table->string('country')->nullable();
                $table->string('city')->nullable();
                $table->string('contact_person');
                $table->string('phone');
                $table->string('email');
                $table->unsignedInteger('student_population')->nullable();
                $table->string('website')->nullable();
                $table->text('message')->nullable();
                $table->string('status')->default('pending');
                $table->unsignedBigInteger('reviewed_by')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('admin_notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('support_tickets')) {
            Schema::create('support_tickets', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->string('institution')->nullable();
                $table->text('question');
                $table->string('source')->default('mbole');
                $table->string('status')->default('open');
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('institution_registration_requests');
        Schema::dropIfExists('general_settings');
    }
}
