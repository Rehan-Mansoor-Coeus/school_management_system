import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useCharacterCertificatesI18n } from '../../../hooks/useCharacterCertificatesI18n'
import { CHARACTER_CERT_STAFF_PERMISSIONS } from '../../../utils/accessControl'
import CertificatesListPage from '../pages/CertificatesListPage'

const linkDefs = [
  {
    path: '/character-certificates',
    label: 'Character Certificate',
    end: true,
    permissions: [...CHARACTER_CERT_STAFF_PERMISSIONS],
  },
  {
    path: '/character-certificates/create',
    labelKey: 'createCertificate',
    permissions: ['character_certificates.manage', 'character_certificates.issue'],
  },
  {
    path: '/character-certificates/my',
    labelKey: 'myCertificates',
    permissions: ['character_certificates.view'],
  },
]

export function CharacterCertificatesIndexPage() {
  const { canAccess } = useAuth()

  if (canAccess({ permissions: [...CHARACTER_CERT_STAFF_PERMISSIONS] })) {
    return <CertificatesListPage />
  }

  if (canAccess({ permissions: ['character_certificates.view'] })) {
    return <Navigate to="/character-certificates/my" replace />
  }

  return <Navigate to="/dashboard" replace />
}

export function CharacterCertificatesStaffRoute({ children }: { children: JSX.Element }) {
  const { canAccess } = useAuth()

  if (!canAccess({ permissions: [...CHARACTER_CERT_STAFF_PERMISSIONS] })) {
    if (canAccess({ permissions: ['character_certificates.view'] })) {
      return <Navigate to="/character-certificates/my" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function CharacterCertificatesLayout() {
  const { canAccess } = useAuth()
  const { t } = useCharacterCertificatesI18n()
  const isStudentPortal = canAccess({ permissions: ['character_certificates.view'] })
    && !canAccess({ permissions: [...CHARACTER_CERT_STAFF_PERMISSIONS] })

  const visibleLinks = linkDefs.filter((link) => canAccess({ permissions: link.permissions }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isStudentPortal ? t('studentModuleSubtitle') : t('moduleSubtitle')}
        </p>
        {!isStudentPortal && (
          <p className="mt-1 text-xs text-slate-400">{t('letterheadNote')}</p>
        )}
      </div>

      {visibleLinks.length > 0 && (
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {link.label ?? t(link.labelKey!)}
            </NavLink>
          ))}
        </nav>
      )}

      <Outlet />
    </div>
  )
}
