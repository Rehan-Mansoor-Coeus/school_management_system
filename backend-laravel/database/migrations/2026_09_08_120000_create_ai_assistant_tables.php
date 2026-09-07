<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CreateAiAssistantTables extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('ai_knowledge_articles')) {
            Schema::create('ai_knowledge_articles', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('title');
                $table->string('slug')->unique();
                $table->string('category', 64)->default('faq');
                $table->string('audience', 32)->default('public');
                $table->text('content');
                $table->text('keywords')->nullable();
                $table->string('source_type', 32)->default('manual');
                $table->string('source_reference')->nullable();
                $table->unsignedBigInteger('institution_id')->nullable();
                $table->boolean('is_public')->default(true);
                $table->boolean('is_active')->default(true);
                $table->string('locale', 8)->default('en');
                $table->text('search_text')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();
                $table->index(['category', 'is_active', 'is_public']);
                $table->index(['institution_id', 'audience']);
            });
        }

        if (! Schema::hasTable('ai_knowledge_embeddings')) {
            Schema::create('ai_knowledge_embeddings', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('article_id');
                $table->unsignedInteger('chunk_index')->default(0);
                $table->text('chunk_text');
                $table->longText('embedding')->nullable();
                $table->timestamps();
                $table->index(['article_id', 'chunk_index']);
            });
        }

        if (! Schema::hasTable('ai_conversations')) {
            Schema::create('ai_conversations', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedBigInteger('institution_id')->nullable();
                $table->string('role_slug', 64)->nullable();
                $table->string('locale', 8)->default('en');
                $table->text('summary')->nullable();
                $table->string('visitor_token_hash', 64)->nullable();
                $table->timestamps();
                $table->index(['user_id', 'updated_at']);
                $table->index('visitor_token_hash');
            });
        }

        if (! Schema::hasTable('ai_messages')) {
            Schema::create('ai_messages', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('conversation_id');
                $table->string('role', 16);
                $table->text('content');
                $table->text('sources')->nullable();
                $table->text('actions')->nullable();
                $table->string('feedback', 16)->nullable();
                $table->timestamps();
                $table->index('conversation_id');
            });
        }

        if (! Schema::hasTable('ai_tool_calls')) {
            Schema::create('ai_tool_calls', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('conversation_id')->nullable();
                $table->unsignedBigInteger('message_id')->nullable();
                $table->string('tool_name', 64);
                $table->text('arguments_json')->nullable();
                $table->string('status', 24)->default('ok');
                $table->unsignedInteger('duration_ms')->nullable();
                $table->timestamps();
                $table->index(['conversation_id', 'tool_name']);
            });
        }

        if (! Schema::hasTable('ai_security_events')) {
            Schema::create('ai_security_events', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->string('event_type', 64);
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedBigInteger('institution_id')->nullable();
                $table->string('role_slug', 64)->nullable();
                $table->text('snippet')->nullable();
                $table->string('ip_address', 64)->nullable();
                $table->timestamps();
                $table->index(['event_type', 'created_at']);
            });
        }

        if (Schema::getConnection()->getDriverName() === 'pgsql' && Schema::hasTable('ai_knowledge_articles')) {
            $hasSearchVector = collect(DB::select("
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'ai_knowledge_articles' AND column_name = 'search_vector'
            "))->isNotEmpty();
            if (! $hasSearchVector) {
                DB::statement('ALTER TABLE ai_knowledge_articles ADD COLUMN search_vector tsvector');
                DB::statement('CREATE INDEX ai_knowledge_articles_search_vector_idx ON ai_knowledge_articles USING GIN (search_vector)');
            }
        }
    }

    public function down()
    {
        Schema::dropIfExists('ai_security_events');
        Schema::dropIfExists('ai_tool_calls');
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
        Schema::dropIfExists('ai_knowledge_embeddings');
        Schema::dropIfExists('ai_knowledge_articles');
    }
}
