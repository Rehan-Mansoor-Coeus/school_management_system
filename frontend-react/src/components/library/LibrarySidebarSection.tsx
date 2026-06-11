import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Library } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { libraryMenuItems } from './libraryMenuConfig'

function nestedLinkClass(isActive: boolean) {
  return [
    'flex items-center gap-2 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium transition',
    isActive ? 'bg-[#2a4a73] text-[#eab308]' : 'text-white hover:bg-[#2a4a73]/70',
  ].join(' ')
}

export default function LibrarySidebarSection() {
  const { hasPermission } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const visibleItems = libraryMenuItems.filter((item) => item.perms.some((p) => hasPermission(p)))

  useEffect(() => {
    if (location.pathname.startsWith('/library')) setOpen(true)
  }, [location.pathname])

  if (visibleItems.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold text-white"
      >
        <span className="flex items-center gap-2">
          <Library className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
          Library
        </span>
        <span className={`transition ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open &&
        visibleItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.path === '/library'} className={({ isActive }) => nestedLinkClass(isActive)}>
            {({ isActive }) => (
              <>
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#eab308]' : 'text-blue-200'}`} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
    </>
  )
}
