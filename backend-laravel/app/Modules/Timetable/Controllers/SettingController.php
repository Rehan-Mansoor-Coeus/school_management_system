<?php

namespace App\Modules\Timetable\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Timetable\Concerns\ResolvesInstitution;
use App\Modules\Timetable\Models\TimetableSetting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    use ResolvesInstitution;

    public function show()
    {
        $settings = TimetableSetting::forInstitution($this->institutionId());

        return response()->json(['success' => true, 'data' => $this->present($settings)]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'max_weekly_teaching_hours' => 'nullable|integer|min:1|max:100',
            'default_lesson_minutes' => 'nullable|integer|min:15|max:600',
            'weeks_per_semester' => 'nullable|integer|min:1|max:52',
            'day_start_time' => 'nullable',
            'day_end_time' => 'nullable',
            'working_days' => 'nullable|array',
            'working_days.*' => 'integer|min:1|max:7',
            'require_dean_approval' => 'nullable|boolean',
        ]);

        $settings = TimetableSetting::forInstitution($this->institutionId());
        $settings->update($data);

        return response()->json(['success' => true, 'message' => 'Timetable settings updated.', 'data' => $this->present($settings->fresh())]);
    }

    protected function present(TimetableSetting $settings): array
    {
        return [
            'institution_id' => $settings->institution_id,
            'max_weekly_teaching_hours' => (int) $settings->max_weekly_teaching_hours,
            'default_lesson_minutes' => (int) $settings->default_lesson_minutes,
            'weeks_per_semester' => (int) $settings->weeks_per_semester,
            'day_start_time' => substr((string) $settings->day_start_time, 0, 5),
            'day_end_time' => substr((string) $settings->day_end_time, 0, 5),
            'working_days' => $settings->workingDays(),
            'require_dean_approval' => (bool) $settings->require_dean_approval,
        ];
    }
}
