import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import api from '../api/client'
import { useToast } from './ui/ToastProvider'

export default function MainLayout() {
  const navigate = useNavigate()
  const { pushToast } = useToast()

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
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
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
          </header>
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
