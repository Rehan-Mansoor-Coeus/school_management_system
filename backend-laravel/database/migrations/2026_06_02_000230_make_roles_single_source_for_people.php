<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Finishes the single-table design: people are now classified purely by their
 * Spatie role. This assigns the proper role to the already-migrated people
 * (and migrates any legacy role_ids), then removes the now-redundant
 * `category` / `role_ids` columns and the per-category detail tables.
 */
class MakeRolesSingleSourceForPeople extends Migration
{
    public function up()
    {
        $hasCategory = Schema::hasColumn('users', 'category');
        $hasRoleIds = Schema::hasColumn('users', 'role_ids');

        if ($hasCategory || $hasRoleIds) {
            $rolesByName = DB::table('roles')->where('guard_name', 'api')->pluck('id', 'name');

            $columns = ['id'];
            if ($hasCategory) {
                $columns[] = 'category';
            }
            if ($hasRoleIds) {
                $columns[] = 'role_ids';
            }

            foreach (DB::table('users')->get($columns) as $user) {
                $roleIds = [];

                if ($hasCategory && in_array($user->category, ['student', 'teacher', 'staff'], true)
                    && isset($rolesByName[$user->category])) {
                    $roleIds[] = (int) $rolesByName[$user->category];
                }

                if ($hasRoleIds && ! empty($user->role_ids)) {
                    $decoded = json_decode($user->role_ids, true);
                    if (is_array($decoded)) {
                        foreach ($decoded as $id) {
                            $roleIds[] = (int) $id;
                        }
                    }
                }

                foreach (array_unique($roleIds) as $roleId) {
                    DB::table('model_has_roles')->updateOrInsert([
                        'role_id' => $roleId,
                        'model_type' => 'App\\User',
                        'model_id' => $user->id,
                    ]);
                }
            }
        }

        Schema::dropIfExists('student_details');
        Schema::dropIfExists('teacher_details');
        Schema::dropIfExists('staff_details');

        Schema::table('users', function (Blueprint $table) use ($hasCategory, $hasRoleIds) {
            if ($hasRoleIds) {
                $table->dropColumn('role_ids');
            }
            if ($hasCategory) {
                $table->dropColumn('category');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'category')) {
                $table->string('category')->nullable()->index()->after('status');
            }
            if (! Schema::hasColumn('users', 'role_ids')) {
                $table->json('role_ids')->nullable()->after('status');
            }
        });

        if (! Schema::hasTable('student_details')) {
            Schema::create('student_details', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id')->unique();
                $table->string('registration_number')->nullable()->index();
                $table->date('admission_date')->nullable();
                $table->string('current_level')->nullable();
                $table->string('guardian_name')->nullable();
                $table->string('guardian_phone')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('teacher_details')) {
            Schema::create('teacher_details', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id')->unique();
                $table->string('staff_number')->nullable()->index();
                $table->string('qualification')->nullable();
                $table->string('specialization')->nullable();
                $table->string('employment_type')->nullable();
                $table->date('hire_date')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        if (! Schema::hasTable('staff_details')) {
            Schema::create('staff_details', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id')->unique();
                $table->string('staff_number')->nullable()->index();
                $table->string('designation')->nullable();
                $table->unsignedBigInteger('department_id')->nullable()->index();
                $table->string('employment_type')->nullable();
                $table->date('hire_date')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }
}
