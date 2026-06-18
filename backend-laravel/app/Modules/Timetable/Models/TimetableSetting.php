<?php

namespace App\Modules\Timetable\Models;

use Illuminate\Database\Eloquent\Model;

class TimetableSetting extends Model
{
    protected $table = 'tt_settings';

    protected $fillable = [
        'institution_id', 'max_weekly_teaching_hours', 'default_lesson_minutes', 'weeks_per_semester',
        'day_start_time', 'day_end_time', 'working_days', 'require_dean_approval',
    ];

    protected $casts = [
        'max_weekly_teaching_hours' => 'integer',
        'default_lesson_minutes' => 'integer',
        'weeks_per_semester' => 'integer',
        'working_days' => 'array',
        'require_dean_approval' => 'boolean',
    ];

    public const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5];

    public static function forInstitution($institutionId): self
    {
        return static::firstOrCreate(
            ['institution_id' => $institutionId],
            [
                'max_weekly_teaching_hours' => 18,
                'default_lesson_minutes' => 60,
                'weeks_per_semester' => 15,
                'day_start_time' => '08:00:00',
                'day_end_time' => '17:00:00',
                'working_days' => self::DEFAULT_WORKING_DAYS,
                'require_dean_approval' => false,
            ]
        );
    }

    public function workingDays(): array
    {
        $days = $this->working_days ?: self::DEFAULT_WORKING_DAYS;

        return array_values(array_filter(array_map('intval', $days), fn ($d) => $d >= 1 && $d <= 7));
    }
}
