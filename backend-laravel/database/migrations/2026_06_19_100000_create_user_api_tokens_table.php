<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserApiTokensTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('user_api_tokens')) {
            return;
        }

        Schema::create('user_api_tokens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('token', 80)->unique();
            $table->string('label')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'created_at']);
        });

        if (Schema::hasTable('users') && class_exists(\App\User::class)) {
            foreach (\App\User::whereNotNull('api_token')->get(['id', 'api_token']) as $user) {
                \App\UserApiToken::firstOrCreate(
                    ['token' => $user->api_token],
                    ['user_id' => $user->id, 'label' => 'legacy']
                );
            }
        }
    }

    public function down()
    {
        Schema::dropIfExists('user_api_tokens');
    }
}
