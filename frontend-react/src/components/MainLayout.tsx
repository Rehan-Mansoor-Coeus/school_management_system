import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, KeyRound, LogOut, UserCircle2 } from 'lucide-react'
import Sidebar from './Sidebar'
import api from '../api/client'
import { returnToPlatform } from '../api/superadmin'
import { bumpAuthEpoch, clearStoredSession, profileFromAuthResponse } from '../utils/authSession'
import { useToast } from './ui/ToastProvider'
import { useTimesheetI18n } from '../hooks/useTimesheetI18n'
import { useAuth } from '../context/AuthContext'
import { NotificationBell } from '../modules/admissions/components/NotificationBell'
import ChangePasswordModal from './ui/ChangePasswordModal'

const SCHOOL_ONLY_PREFIXES = [
  '/timetable',
  '/attendance',
  '/results',
  '/fees',
  '/hr',
  '/assets',
  '/hostel',
  '/canteen',
  '/library',
  '/admissions',
  '/timesheets',
  '/tasks',
  '/letters',
  '/contracts',
  '/documents',
  '/users',
  '/roles',
  '/permissions',
  '/modules',
  '/reports',
  '/audit',
  '/notifications',
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { pushToast } = useToast()
  const { locale, setAppLocale } = useTimesheetI18n()
  const {
    user,
    clearAuth,
    setAuth,
    leaveInstitutionContext,
    isPlatformContext,
    isPlatformSuperAdmin,
    actingAsSuperAdmin,
    activeInstitution,
  } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const displayName = (user?.name as string) || 'Account'
  const displayEmail = (user?.email as string) || (user?.username as string) || ''
  const managingInstitution = actingAsSuperAdmin && activeInstitution?.name
    ? String(activeInstitution.name)
    : null

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keep platform SA on the Super Admin shell (never school Timetable/modules).
  useEffect(() => {
    if (!(isPlatformSuperAdmin && isPlatformContext)) return
    const path = location.pathname
    if (path === '/dashboard' || SCHOOL_ONLY_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      navigate('/super-admin/dashboard', { replace: true })
    }
  }, [isPlatformSuperAdmin, isPlatformContext, location.pathname, navigate])

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore network failure during logout
    }
    clearStoredSession()
    clearAuth()
    navigate('/admin')
    pushToast('Logged out successfully.', 'info')
  }

  const returnToSuperAdmin = async () => {
    bumpAuthEpoch()
    try {
      const res = await returnToPlatform()
      const profile = profileFromAuthResponse(res.data as Record<string, unknown>)
      leaveInstitutionContext()
      setAuth(profile)
    } catch {
      leaveInstitutionContext()
    }
    navigate('/super-admin/dashboard')
    pushToast('Returned to Super Admin platform.', 'info')
  }

  const headerTitle = isPlatformSuperAdmin && isPlatformContext
    ? 'Okusoma Super Admin'
    : managingInstitution || 'School Management'
  const headerSubtitle = isPlatformSuperAdmin && isPlatformContext
    ? 'Platform Administration · No institution selected'
    : managingInstitution
      ? 'Acting as this school (Super Admin)'
      : 'Manage users, roles, and permissions.'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <div className="sticky top-0 h-screen w-full shrink-0 overflow-hidden sm:w-72">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1">
          {managingInstitution && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-900">
              <span>
                Acting as {managingInstitution}
                {' '}
                <span className="font-normal">(Super Admin)</span>
              </span>
              <button
                type="button"
                onClick={returnToSuperAdmin}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Return to platform
              </button>
            </div>
          )}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div>
              <h1 className="text-lg font-semibold">{headerTitle}</h1>
              <p className="text-sm text-slate-500">{headerSubtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <select value={locale} onChange={(e) => setAppLocale(e.target.value as 'en' | 'fr')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>

              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3a5f] text-white">
                    <UserCircle2 className="h-5 w-5" />
                  </span>
                  <span className="hidden max-w-[140px] truncate sm:inline">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                      {displayEmail ? <p className="truncate text-xs text-slate-500">{displayEmail}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        setPasswordOpen(true)
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <KeyRound className="h-4 w-4 text-slate-500" />
                      Change password
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-sm text-rose-700 hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  )
}
