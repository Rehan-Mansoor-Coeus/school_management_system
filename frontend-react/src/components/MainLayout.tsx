import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import api from '../api/client'
import { useToast } from './ui/ToastProvider'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'

export default function MainLayout() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { locale, setAppLocale } = useTimesheetI18n()

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // ignore network failure during logout
    }
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    navigate('/login')
    pushToast('Logged out successfully.', 'info')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex flex-col sm:flex-row">
        <Sidebar />
        <div className="flex-1">
          <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h1 className="text-lg font-semibold">School Management</h1>
              <p className="text-sm text-slate-500">Manage users, roles, and permissions.</p>
            </div>
            <button
              onClick={logout}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Logout
            </button>
            <select value={locale} onChange={(e) => setAppLocale(e.target.value as 'en' | 'fr')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </header>
          <main className="p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
