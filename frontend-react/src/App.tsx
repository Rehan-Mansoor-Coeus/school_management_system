import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import RolesPage from './pages/Roles'
import PermissionsPage from './pages/Permissions'
import ModulesPage from './pages/Modules'
import InstitutionList from './modules/Institutions/pages/InstitutionList'
import DepartmentsPage from './pages/Departments'
import AcademicsPage from './pages/Academics'
import PlaceholderModulePage from './pages/PlaceholderModule'
import FeesDashboardPage from './modules/fees/pages/FeesDashboardPage'
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
import LetterVerifyPage from './pages/letters/LetterVerifyPage'
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
  AnnouncementTemplatesPage,
  CreateAnnouncementPage,
  ScheduledAnnouncementsPage,
} from './pages/letters/AnnouncementPages'
import AddUserPage from './pages/people/AddUserPage'
import PeopleEntityPage from './pages/people/PeopleEntityPage'
import CustomersPage from './pages/people/CustomersPage'
import StudentsPage from './pages/people/StudentsPage'
import TeachersPage from './pages/people/TeachersPage'
import StaffPage from './pages/people/StaffPage'
import AdmissionsLayout from './modules/admissions/components/AdmissionsLayout'
import AdmissionsOverviewPage from './modules/admissions/pages/AdmissionsOverviewPage'
import { ApplicationPage } from './modules/admissions/pages/ApplicationPage'
import MyApplicationsPage from './modules/admissions/pages/MyApplicationsPage'
import ApplicationDetailPage from './modules/admissions/pages/ApplicationDetailPage'
import AllApplicationsPage from './modules/admissions/pages/AllApplicationsPage'
import RegistryPage from './modules/admissions/pages/RegistryPage'
import DepartmentPage from './modules/admissions/pages/DepartmentPage'
import RegistrarAdmissionsPage from './modules/admissions/pages/RegistrarAdmissionsPage'
import FinancePage from './modules/admissions/pages/FinancePage'
import CourseRegistrationPage from './modules/admissions/pages/CourseRegistrationPage'
import HodCourseApprovalPage from './modules/admissions/pages/HodCourseApprovalPage'
import CanteenLayout from './modules/canteen/components/CanteenLayout'
import CanteenOverviewPage from './modules/canteen/pages/CanteenOverviewPage'
import MealPlansPage from './modules/canteen/pages/MealPlansPage'
import FeedingPlansPage from './modules/canteen/pages/FeedingPlansPage'
import WalletsPage from './modules/canteen/pages/WalletsPage'
import MyWalletPage from './modules/canteen/pages/MyWalletPage'
import VerifyMealPage from './modules/canteen/pages/VerifyMealPage'
import MealAttendancePage from './modules/canteen/pages/MealAttendancePage'
import ReportsPage from './modules/canteen/pages/ReportsPage'
import CharacterCertificatesLayout, {
  CharacterCertificatesIndexPage,
  CharacterCertificatesStaffRoute,
} from './modules/characterCertificates/components/CharacterCertificatesLayout'
import CreateCertificatePage from './modules/characterCertificates/pages/CreateCertificatePage'
import CertificateDetailPage from './modules/characterCertificates/pages/CertificateDetailPage'
import MyCertificatesPage from './modules/characterCertificates/pages/MyCertificatesPage'
import HostelLayout from './modules/hostel/components/HostelLayout'
import HostelOverviewPage from './modules/hostel/pages/HostelOverviewPage'
import HostelsPage from './modules/hostel/pages/HostelsPage'
import RoomsPage from './modules/hostel/pages/RoomsPage'
import RegistrationsPage from './modules/hostel/pages/RegistrationsPage'
import AllocationsPage from './modules/hostel/pages/AllocationsPage'
import PaymentsPage from './modules/hostel/pages/PaymentsPage'
import ClearancePage from './modules/hostel/pages/ClearancePage'
import MaintenancePage from './modules/hostel/pages/MaintenancePage'
import MyHostelPage from './modules/hostel/pages/MyHostelPage'
import UsersLayout, { UsersIndexPage } from './components/users/UsersLayout'

export default function App(){
  return (
    <ToastProvider>
      <TimesheetI18nProvider>
      <LettersI18nProvider>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/letters/verify/:id" element={<LetterVerifyPage />} />

        <Route element={<ProtectedRoute><MainLayout/></ProtectedRoute>}>
          <Route index element={<DashboardPage/>} />
          <Route path="users" element={<UsersLayout />}>
            <Route index element={<UsersIndexPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/add" element={<CustomersPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/add" element={<StudentsPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="teachers/add" element={<TeachersPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="staff/add" element={<StaffPage />} />
          </Route>
          <Route path="customers" element={<Navigate to="/users/customers" replace />} />
          <Route path="customers/add" element={<Navigate to="/users/customers/add" replace />} />
          <Route path="students" element={<Navigate to="/users/students" replace />} />
          <Route path="students/add" element={<Navigate to="/users/students/add" replace />} />
          <Route path="teachers" element={<Navigate to="/users/teachers" replace />} />
          <Route path="teachers/add" element={<Navigate to="/users/teachers/add" replace />} />
          <Route path="staff" element={<Navigate to="/users/staff" replace />} />
          <Route path="staff/add" element={<Navigate to="/users/staff/add" replace />} />
          <Route path="access/teachers" element={<Navigate to="/users/teachers" replace />} />
          <Route path="access/students" element={<Navigate to="/users/students" replace />} />
          <Route path="roles" element={<RolesPage/>} />
          <Route path="permissions" element={<PermissionsPage/>} />
          <Route path="modules" element={<ModulesPage/>} />
          <Route path="institutions" element={<InstitutionList />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="admissions" element={<AdmissionsLayout />}>
            <Route index element={<AdmissionsOverviewPage />} />
            <Route path="apply" element={<ApplicationPage />} />
            <Route path="my-applications" element={<MyApplicationsPage />} />
            <Route path="my-applications/:id" element={<ApplicationDetailPage />} />
            <Route path="applications" element={<AllApplicationsPage />} />
            <Route path="applications/:id" element={<ApplicationDetailPage />} />
            <Route path="registry" element={<RegistryPage />} />
            <Route path="department" element={<DepartmentPage />} />
            <Route path="registrar" element={<RegistrarAdmissionsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="courses" element={<CourseRegistrationPage />} />
            <Route path="hod-courses" element={<HodCourseApprovalPage />} />
          </Route>
          <Route path="academics" element={<AcademicsPage />} />
          <Route path="academics/programmes" element={<AcademicsPage initialTab="programmes" />} />
          <Route path="academics/subjects" element={<AcademicsPage initialTab="subjects" />} />
          <Route path="attendance" element={<PlaceholderModulePage title="Attendance" />} />
          <Route path="results" element={<PlaceholderModulePage title="Results" />} />
          <Route path="fees" element={<FeesDashboardPage />} />
          <Route path="hr" element={<PlaceholderModulePage title="HR & Payroll" />} />
          <Route path="assets" element={<PlaceholderModulePage title="Assets" />} />
          <Route path="library" element={<PlaceholderModulePage title="Library" />} />
          <Route path="hostel" element={<HostelLayout />}>
            <Route index element={<HostelOverviewPage />} />
            <Route path="hostels" element={<HostelsPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="registrations" element={<RegistrationsPage />} />
            <Route path="allocations" element={<AllocationsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="clearance" element={<ClearancePage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="my" element={<MyHostelPage />} />
          </Route>
          <Route path="canteen" element={<CanteenLayout />}>
            <Route index element={<CanteenOverviewPage />} />
            <Route path="meals" element={<MealPlansPage />} />
            <Route path="feeding-plans" element={<FeedingPlansPage />} />
            <Route path="wallets" element={<WalletsPage />} />
            <Route path="my-wallet" element={<MyWalletPage />} />
            <Route path="verify" element={<VerifyMealPage />} />
            <Route path="attendance" element={<MealAttendancePage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route path="character-certificates" element={<CharacterCertificatesLayout />}>
            <Route index element={<CharacterCertificatesIndexPage />} />
            <Route path="create" element={<CharacterCertificatesStaffRoute><CreateCertificatePage /></CharacterCertificatesStaffRoute>} />
            <Route path="my" element={<MyCertificatesPage />} />
            <Route path=":id" element={<CharacterCertificatesStaffRoute><CertificateDetailPage /></CharacterCertificatesStaffRoute>} />
          </Route>
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
            <Route path="edit/:id" element={<CreateLetterPage />} />
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
            <Route path="announcements/templates" element={<AnnouncementTemplatesPage />} />
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
