import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import InstitutionRequestsPage from './InstitutionRequestsPage'

export default function ApplicationsEntry() {
  const { canAccess, isPlatformContext, isPlatformSuperAdmin } = useAuth()

  if (isPlatformSuperAdmin && isPlatformContext) {
    return <InstitutionRequestsPage />
  }

  const isStaff = canAccess({
    permissions: [
      'admissions.view',
      'admissions.manage',
      'admissions.registry.review',
      'admissions.department.review',
      'admissions.finance.verify',
      'admissions.registrar.admit',
      'admissions.hod.approve',
    ],
  })

  if (isStaff) {
    return <Navigate to="/admissions/applications" replace />
  }

  return <Navigate to="/admissions/my-applications" replace />
}
