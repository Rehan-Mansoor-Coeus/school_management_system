<?php

namespace App\Modules\Contracts\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentWorkflowSetting extends Model
{
    protected $fillable = [
        'institution_id',
        'expiry_alerts_enabled',
        'expiry_alert_days',
        'expiry_alert_channels',
        'expiry_alert_recipients',
    ];

    protected $casts = [
        'expiry_alerts_enabled' => 'boolean',
        'expiry_alert_days' => 'array',
        'expiry_alert_channels' => 'array',
    ];

    /**
     * Default lead times (in days) at which expiry alerts are sent.
     */
    public const DEFAULT_ALERT_DAYS = [90, 60];

    public const DEFAULT_ALERT_CHANNELS = ['email', 'internal'];

    public static function forInstitution($institutionId): self
    {
        return static::firstOrCreate(
            ['institution_id' => $institutionId],
            [
                'expiry_alerts_enabled' => true,
                'expiry_alert_days' => self::DEFAULT_ALERT_DAYS,
                'expiry_alert_channels' => self::DEFAULT_ALERT_CHANNELS,
            ]
        );
    }

    public function alertDays(): array
    {
        $days = $this->expiry_alert_days ?: self::DEFAULT_ALERT_DAYS;
        $days = array_values(array_filter(array_map('intval', $days), fn ($d) => $d > 0));
        rsort($days);

        return $days ?: self::DEFAULT_ALERT_DAYS;
    }

    public function alertChannels(): array
    {
        $channels = $this->expiry_alert_channels ?: self::DEFAULT_ALERT_CHANNELS;

        return array_values(array_filter($channels, fn ($c) => in_array($c, ['email', 'whatsapp', 'internal'], true)))
            ?: self::DEFAULT_ALERT_CHANNELS;
    }

    public function extraRecipients(): array
    {
        if (! $this->expiry_alert_recipients) {
            return [];
        }

        return array_values(array_filter(array_map('trim', preg_split('/[,;\s]+/', $this->expiry_alert_recipients))));
    }
}
