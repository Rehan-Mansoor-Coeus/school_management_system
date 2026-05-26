import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import UsersPage from './pages/Users'
import RolesPage from './pages/Roles'
import PermissionsPage from './pages/Permissions'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import { ToastProvider } from './components/ui/ToastProvider'

export default function App(){
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage/>} />

        <Route element={<ProtectedRoute><MainLayout/></ProtectedRoute>}>
          <Route index element={<DashboardPage/>} />
          <Route path="users" element={<UsersPage/>} />
          <Route path="roles" element={<RolesPage/>} />
          <Route path="permissions" element={<PermissionsPage/>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  )
}
