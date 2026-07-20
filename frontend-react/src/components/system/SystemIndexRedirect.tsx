import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function SystemIndexRedirect() {
  const { isPlatformSuperAdmin, hasAnyRole } = useAuth()
  const isPlatformAdmin = isPlatformSuperAdmin || hasAnyRole(['super-admin', 'system-super-admin'])

  return <Navigate to={isPlatformAdmin ? 'general-settings' : 'institution-settings'} replace />
}
