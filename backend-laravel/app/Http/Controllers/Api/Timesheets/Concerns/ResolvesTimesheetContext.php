<?php

namespace App\Http\Controllers\Api\Timesheets\Concerns;

use App\Support\AdminContext;
use App\TimesheetAuditLog;
use App\User;
use Illuminate\Http\Request;

trait ResolvesTimesheetContext
{
    protected function institutionId(Request $request)
    {
        return AdminContext::requireInstitutionId($request);
    }

    protected function locale(Request $request)
    {
        $locale = $request->get('locale', optional($request->user())->locale ?: 'en');
        return in_array($locale, ['en', 'fr'], true) ? $locale : 'en';
    }

    protected function trans(Request $request, $key, array $replace = [])
    {
        $previous = app()->getLocale();
        app()->setLocale($this->locale($request));
        $text = __($key, $replace);
        app()->setLocale($previous);
        return $text;
    }

    protected function userInInstitution(Request $request, $userId)
    {
        return User::where('institution_id', $this->institutionId($request))
            ->where('id', $userId)
            ->exists();
    }

    protected function audit($institutionId, $event, $actorId, $entityType = null, $entityId = null, $metadata = null, $timesheetId = null, $entryId = null)
    {
        TimesheetAuditLog::create([
            'institution_id' => $institutionId,
            'timesheet_id' => $timesheetId,
            'entry_id' => $entryId,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'actor_id' => $actorId,
            'event' => $event,
            'metadata' => $metadata,
        ]);
    }
}
