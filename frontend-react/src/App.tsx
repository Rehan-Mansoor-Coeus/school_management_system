import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import UsersPage from './pages/Users'
import RolesPage from './pages/Roles'
import PermissionsPage from './pages/Permissions'
import ModulesPage from './pages/Modules'
import InstitutionList from './modules/Institutions/pages/InstitutionList'
import PlaceholderModulePage from './pages/PlaceholderModule'
import TimesheetCategoriesPage from './pages/TimesheetCategories'
import TimesheetActivitiesPage from './pages/TimesheetActivities'
import FillTimesheetPage from './pages/FillTimesheet'
import WorkingWeekPage from './pages/WorkingWeek'
import TimesheetManageAllPage from './pages/TimesheetManageAll'
import TimesheetReportPage from './pages/TimesheetReport'
import OvertimeReportPage from './pages/OvertimeReport'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import { ToastProvider } from './components/ui/ToastProvider'
import { TimesheetI18nProvider } from './hooks/useTimesheetI18n'
import { LettersI18nProvider } from './hooks/useLettersI18n'
import LettersLayout from './components/letters/LettersLayout'
import CreateLetterPage from './pages/letters/CreateLetterPage'
import LetterCategoriesPage from './pages/letters/LetterCategoriesPage'
import LetterListingPage from './pages/letters/LetterListingPage'
import LetterPrintPage from './pages/letters/LetterPrintPage'
import LetterSettingsPage from './pages/letters/LetterSettingsPage'
import LetterTemplatesPage from './pages/letters/LetterTemplatesPage'
import {
  AwaitingApprovalLettersPage,
  AwaitingEditingLettersPage,
  AwaitingSignatureLettersPage,
  DownloadableLettersPage,
  PendingLettersPage,
  PrintableLettersPage,
  ReadyToSendLettersPage,
  RejectedLettersPage,
  SentLettersPage,
} from './pages/letters/LetterStatusPages'
import MessageLogsPage from './pages/letters/MessageLogsPage'
import WhatsAppSettingsPage from './pages/letters/WhatsAppSettingsPage'
import {
  AnnouncementListPage,
  CreateAnnouncementPage,
  ScheduledAnnouncementsPage,
} from './pages/letters/AnnouncementPages'
import AddUserPage from './pages/people/AddUserPage'
import PeopleEntityPage from './pages/people/PeopleEntityPage'

export default function App(){
  return (
    <ToastProvider>
      <TimesheetI18nProvider>
      <LettersI18nProvider>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />

        <Route element={<ProtectedRoute><MainLayout/></ProtectedRoute>}>
          <Route index element={<DashboardPage/>} />
          <Route path="users" element={<UsersPage/>} />
          <Route path="roles" element={<RolesPage/>} />
          <Route path="permissions" element={<PermissionsPage/>} />
          <Route path="modules" element={<ModulesPage/>} />
          <Route path="institutions" element={<InstitutionList />} />
          <Route path="admissions" element={<PlaceholderModulePage title="Admissions" />} />
          <Route path="academics" element={<PlaceholderModulePage title="Academics" />} />
          <Route path="attendance" element={<PlaceholderModulePage title="Attendance" />} />
          <Route path="results" element={<PlaceholderModulePage title="Results" />} />
          <Route path="fees" element={<PlaceholderModulePage title="Fees & Payments" />} />
          <Route path="hr" element={<PlaceholderModulePage title="HR & Payroll" />} />
          <Route path="assets" element={<PlaceholderModulePage title="Assets" />} />
          <Route path="library" element={<PlaceholderModulePage title="Library" />} />
          <Route path="hostel" element={<PlaceholderModulePage title="Hostel" />} />
          <Route path="canteen" element={<PlaceholderModulePage title="Canteen" />} />
          <Route path="notifications" element={<PlaceholderModulePage title="Notifications" />} />
          <Route path="audit" element={<PlaceholderModulePage title="Audit Logs" />} />

          {/* Employee timesheet flow */}
          <Route path="timesheets/activities/create" element={<TimesheetActivitiesPage/>} />
          <Route path="timesheets/fill" element={<FillTimesheetPage/>} />
          <Route path="timesheets/working-week" element={<WorkingWeekPage/>} />
          <Route path="timesheets/admin/categories" element={<TimesheetCategoriesPage/>} />
          <Route path="timesheets/admin/manage-all" element={<TimesheetManageAllPage/>} />
          <Route path="timesheets/admin/reports" element={<TimesheetReportPage/>} />
          <Route path="timesheets/admin/overtime-report" element={<OvertimeReportPage/>} />

          {/* Legacy timesheet routes redirect to simplified flow */}
          <Route path="timesheets/*" element={<Navigate to="/timesheets/fill" replace />} />

          {/* Letters & Announcements */}
          <Route path="letters" element={<LettersLayout />}>
            <Route index element={<Navigate to="/letters/listing" replace />} />
            <Route path="listing" element={<LetterListingPage />} />
            <Route path="create" element={<CreateLetterPage />} />
            <Route path="templates" element={<LetterTemplatesPage />} />
            <Route path="sent" element={<SentLettersPage />} />
            <Route path="pending" element={<PendingLettersPage />} />
            <Route path="categories" element={<LetterCategoriesPage />} />
            <Route path="settings" element={<LetterSettingsPage />} />
            <Route path="rejected" element={<RejectedLettersPage />} />
            <Route path="awaiting-editing" element={<AwaitingEditingLettersPage />} />
            <Route path="awaiting-approval" element={<AwaitingApprovalLettersPage />} />
            <Route path="awaiting-signature" element={<AwaitingSignatureLettersPage />} />
            <Route path="ready-to-send" element={<ReadyToSendLettersPage />} />
            <Route path="print" element={<PrintableLettersPage />} />
            <Route path="download" element={<DownloadableLettersPage />} />
            <Route path="announcements/create" element={<CreateAnnouncementPage />} />
            <Route path="announcements/scheduled" element={<ScheduledAnnouncementsPage />} />
            <Route path="announcements" element={<AnnouncementListPage />} />
            <Route path="message-logs" element={<MessageLogsPage />} />
            <Route path="whatsapp-settings" element={<WhatsAppSettingsPage />} />
          </Route>
          <Route path="letters/print-view/:id" element={<LetterPrintPage />} />

          {/* People (recipients for letters) */}
          <Route path="people/users/add" element={<AddUserPage />} />
          <Route path="people/:entity/add" element={<PeopleEntityPage />} />
          <Route path="people/:entity" element={<PeopleEntityPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </LettersI18nProvider>
      </TimesheetI18nProvider>
    </ToastProvider>
  )
}
