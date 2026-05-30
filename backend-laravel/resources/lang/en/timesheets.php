<?php

return [
    'module' => 'Timesheets',
    'my_schedule' => 'My Schedule',
    'contact_hours' => 'Contact Hours',
    'submit_timesheet' => 'Submit Timesheet',
    'topic_taught' => 'Topic Taught',
    'course_master' => 'Course Master',
    'required_contact_hours' => 'Required Contact Hours',
    'completed_contact_hours' => 'Completed Contact Hours',
    'remaining_contact_hours' => 'Remaining Contact Hours',
    'approve' => 'Approve',
    'reject' => 'Reject',
    'request_correction' => 'Request Correction',
    'shift_types' => 'Shift Types',
    'teacher_availability' => 'Teacher Availability',
    'course_planning' => 'Course Contact Hour Planning',
    'timetable_suggestion' => 'Timetable Suggestion',
    'teacher_schedules' => 'Teacher Schedules',
    'staff_schedules' => 'Staff Work Schedules',
    'reports' => 'Reports',
    'dashboard' => 'Timesheet Dashboard',
    'saved' => 'Saved successfully.',
    'submitted' => 'Submitted successfully.',
    'approved' => 'Approved successfully.',
    'rejected' => 'Rejected successfully.',
    'correction_requested' => 'Correction requested.',
    'not_authorized' => 'You are not authorized to perform this action.',
    'institution_mismatch' => 'Record not found in your institution.',
    'teacher_conflict' => 'Teacher schedule conflict detected.',
    'class_conflict' => 'Class schedule conflict detected.',
    'outside_availability' => 'Schedule is outside teacher availability.',
    'duplicate_entry' => 'A timesheet entry already exists for this schedule and date.',
    'empty_timesheet' => 'Cannot submit an empty timesheet.',
    'validation_failed' => 'Validation failed.',
    'notifications' => [
        'class_starting' => [
            'title' => 'Class Starting Soon',
            'message' => 'Dear :name, your :course class starts at :time.',
        ],
        'class_ending' => [
            'title' => 'Class Ending Soon',
            'message' => 'Dear :name, your :course class ends at :time.',
        ],
        'timesheet_missing' => [
            'title' => 'Timesheet Missing',
            'message' => 'Dear :name, please submit your timesheet for :course.',
        ],
        'timesheet_approved' => [
            'title' => 'Timesheet Approved',
            'message' => 'Dear :name, your timesheet has been approved.',
        ],
        'timesheet_rejected' => [
            'title' => 'Timesheet Rejected',
            'message' => 'Dear :name, your timesheet was rejected. Reason: :reason',
        ],
        'correction_requested' => [
            'title' => 'Correction Requested',
            'message' => 'Dear :name, correction is required on your timesheet. Reason: :reason',
        ],
        'course_hours_behind' => [
            'title' => 'Contact Hours Behind Schedule',
            'message' => 'Course :course is behind schedule. Remaining contact hours: :remaining.',
        ],
        'course_hours_completed' => [
            'title' => 'Contact Hours Completed',
            'message' => 'Course :course has completed required contact hours.',
        ],
        'timetable_conflict' => [
            'title' => 'Timetable Conflict',
            'message' => 'A timetable conflict was detected for :course.',
        ],
        'shift_starting' => [
            'title' => 'Shift Starting',
            'message' => 'Dear :name, your shift starts at :time.',
        ],
        'shift_ending' => [
            'title' => 'Shift Ending',
            'message' => 'Dear :name, your shift ends at :time.',
        ],
    ],
];
