import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import api from '../api/client'
import { useToast } from './ui/ToastProvider'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'
// import { useAuth } from '../hooks/useAuth'
import { useAuth } from '../context/AuthContext'

export default function MainLayout() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { locale, setAppLocale } = useTimesheetI18n()
  const { institution } = useAuth()

  const institutionName = institution?.name || 'School Management'
  const { clearAuth } = useAuth()

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // ignore network failure during logout
    }
    localStorage.removeItem('token')
    clearAuth()
    delete api.defaults.headers.common['Authorization']
    navigate('/login')
    pushToast('Logged out successfully.', 'info')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <div className="sticky top-0 h-screen w-full shrink-0 overflow-hidden sm:w-72">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
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
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
