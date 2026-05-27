import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import UsersPage from './pages/Users'
import RolesPage from './pages/Roles'
import PermissionsPage from './pages/Permissions'
import TimesheetDashboardPage from './pages/TimesheetDashboard'
import MyTimesheetsPage from './pages/MyTimesheets'
import AddTimesheetEntryPage from './pages/AddTimesheetEntry'
import SubmitWeeklyTimesheetPage from './pages/SubmitWeeklyTimesheet'
import TimesheetApprovalsPage from './pages/TimesheetApprovals'
import TimesheetReportsPage from './pages/TimesheetReports'
import WorkingScheduleSettingsPage from './pages/WorkingScheduleSettings'
import ShiftTypeSettingsPage from './pages/ShiftTypeSettings'
import TeacherAvailabilitySettingsPage from './pages/TeacherAvailabilitySettings'
import CourseContactHourPlanningPage from './pages/CourseContactHourPlanning'
import TimetableSuggestionPage from './pages/TimetableSuggestion'
import TeacherScheduleAssignmentPage from './pages/TeacherScheduleAssignment'
import MyTeachingSchedulePage from './pages/MyTeachingSchedule'
import SubmitTeachingTimesheetPage from './pages/SubmitTeachingTimesheet'
import MyStaffTimesheetPage from './pages/MyStaffTimesheet'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import { ToastProvider } from './components/ui/ToastProvider'
import { TimesheetI18nProvider } from './hooks/useTimesheetI18n'

export default function App(){
  return (
    <ToastProvider>
      <TimesheetI18nProvider>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />

        <Route element={<ProtectedRoute><MainLayout/></ProtectedRoute>}>
          <Route index element={<DashboardPage/>} />
          <Route path="users" element={<UsersPage/>} />
          <Route path="roles" element={<RolesPage/>} />
          <Route path="permissions" element={<PermissionsPage/>} />
          <Route path="timesheets/dashboard" element={<TimesheetDashboardPage/>} />
          <Route path="timesheets/shift-types" element={<ShiftTypeSettingsPage/>} />
          <Route path="timesheets/teacher-availability" element={<TeacherAvailabilitySettingsPage/>} />
          <Route path="timesheets/course-planning" element={<CourseContactHourPlanningPage/>} />
          <Route path="timesheets/timetable-suggestion" element={<TimetableSuggestionPage/>} />
          <Route path="timesheets/teacher-assignment" element={<TeacherScheduleAssignmentPage/>} />
          <Route path="timesheets/my-teaching-schedule" element={<MyTeachingSchedulePage/>} />
          <Route path="timesheets/submit-teaching" element={<SubmitTeachingTimesheetPage/>} />
          <Route path="timesheets/my-staff-timesheet" element={<MyStaffTimesheetPage/>} />
          <Route path="timesheets/my" element={<MyTimesheetsPage/>} />
          <Route path="timesheets/add-entry" element={<AddTimesheetEntryPage/>} />
          <Route path="timesheets/submit" element={<SubmitWeeklyTimesheetPage/>} />
          <Route path="timesheets/approvals" element={<TimesheetApprovalsPage/>} />
          <Route path="timesheets/reports" element={<TimesheetReportsPage/>} />
          <Route path="timesheets/schedules" element={<WorkingScheduleSettingsPage/>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </TimesheetI18nProvider>
    </ToastProvider>
  )
}
