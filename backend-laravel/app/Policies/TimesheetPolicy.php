<?php

namespace App\Policies;

use App\User;

class TimesheetPolicy
{
    public function before(User $user, $ability)
    {
        if ($user->hasRole('super-admin')) {
            return true;
        }
    }

    public function manageShiftTypes(User $user)
    {
        return $user->hasPermissionTo('manage_shift_types')
            || $user->hasPermissionTo('timesheets.manage_shift_types');
    }

    public function approveTimesheets(User $user)
    {
        return $user->hasPermissionTo('approve_timesheets')
            || $user->hasPermissionTo('timesheets.approve_timesheets');
    }

    public function viewReports(User $user)
    {
        return $user->hasPermissionTo('view_timesheet_reports')
            || $user->hasPermissionTo('timesheets.view_timesheet_reports');
    }
}
