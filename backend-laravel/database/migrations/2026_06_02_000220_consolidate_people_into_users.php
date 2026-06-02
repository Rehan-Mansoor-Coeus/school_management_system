<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ConsolidatePeopleIntoUsers extends Migration
{
    protected $map = [
        'people_students' => 'student',
        'people_teachers' => 'teacher',
        'people_staff' => 'staff',
    ];

    public function up()
    {
        foreach ($this->map as $table => $category) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            foreach (DB::table($table)->orderBy('id')->get() as $row) {
                $email = $row->email ?: null;

                // users.email is UNIQUE; drop the value if it collides with an existing row.
                if ($email && DB::table('users')->where('email', $email)->exists()) {
                    $email = null;
                }

                $status = $row->status ?? 'active';

                DB::table('users')->insert([
                    'institution_id' => $row->institution_id,
                    'name' => $row->name,
                    'email' => $email,
                    'phone_number' => $row->phone_number ?? null,
                    'additional_phone_number' => $row->additional_phone_number ?? null,
                    'address' => $row->address ?? null,
                    'status' => $status,
                    'is_active' => $status === 'active' ? 1 : 0,
                    'category' => $category,
                    'role_ids' => $row->role_ids ?? null,
                    'locale' => 'en',
                    'password' => Hash::make(Str::random(40)),
                    'created_at' => $row->created_at ?? now(),
                    'updated_at' => $row->updated_at ?? now(),
                ]);
            }

            Schema::dropIfExists($table);
        }
    }

    public function down()
    {
        // Recreate the people_* tables with their original shape.
        foreach (array_keys($this->map) as $table) {
            if (! Schema::hasTable($table)) {
                Schema::create($table, function (Blueprint $table) {
                    $table->bigIncrements('id');
                    $table->unsignedBigInteger('institution_id')->index();
                    $table->string('name');
                    $table->string('email')->nullable();
                    $table->string('phone_number');
                    $table->string('additional_phone_number')->nullable();
                    $table->text('address')->nullable();
                    $table->string('status')->default('active')->index();
                    $table->json('role_ids')->nullable();
                    $table->timestamps();
                });
            }
        }

        // Move category rows back out of users into their people_* table.
        foreach ($this->map as $table => $category) {
            foreach (DB::table('users')->where('category', $category)->orderBy('id')->get() as $row) {
                DB::table($table)->insert([
                    'institution_id' => $row->institution_id,
                    'name' => $row->name,
                    'email' => $row->email,
                    'phone_number' => $row->phone_number,
                    'additional_phone_number' => $row->additional_phone_number,
                    'address' => $row->address,
                    'status' => $row->status,
                    'role_ids' => $row->role_ids,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]);
            }

            DB::table('users')->where('category', $category)->delete();
        }
    }
}
