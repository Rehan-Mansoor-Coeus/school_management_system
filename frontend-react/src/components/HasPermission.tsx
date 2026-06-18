import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function HasPermission({
  permission,
  permissions,
  children,
  fallback = null,
}: {
  permission?: string
  permissions?: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { hasPermission } = useAuth()

  const allowed = permission
    ? hasPermission(permission)
    : (permissions || []).some((p) => hasPermission(p))

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
