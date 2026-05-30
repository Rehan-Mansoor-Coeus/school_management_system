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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </TimesheetI18nProvider>
    </ToastProvider>
  )
}
