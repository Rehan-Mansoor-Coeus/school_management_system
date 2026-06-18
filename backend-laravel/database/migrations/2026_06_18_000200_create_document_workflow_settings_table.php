<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDocumentWorkflowSettingsTable extends Migration
{
    public function up()
    {
        if (! Schema::hasTable('document_workflow_settings')) {
            Schema::create('document_workflow_settings', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('institution_id')->unique();
                $table->boolean('expiry_alerts_enabled')->default(true);
                // License/expiry alert lead times in days, e.g. [90, 60]
                $table->json('expiry_alert_days')->nullable();
                // Channels used for expiry alerts: email, whatsapp, internal
                $table->json('expiry_alert_channels')->nullable();
                // Extra recipients (comma list of emails) notified in addition to the document recipient
                $table->text('expiry_alert_recipients')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('document_workflow_settings');
    }
}
