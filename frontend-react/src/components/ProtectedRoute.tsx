import React from 'react'
import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({children}:{children:JSX.Element}){
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const { setAuth } = useAuth()

  useEffect(()=>{
    api
      .get('/auth/user')
      .then((res) => {
        const user = res.data?.user ?? res.data
        const enabledModules = res.data?.enabled_modules ?? []
        const permissions = res.data?.permissions ?? []
        localStorage.setItem('me', JSON.stringify(user))
        localStorage.setItem('permissions', JSON.stringify(permissions))
        localStorage.setItem('enabled_modules', JSON.stringify(enabledModules))
        setAuth({ user, permissions, enabledModules })
        setAuthed(true)
      })
      .catch(() => {
        localStorage.removeItem('me')
        localStorage.removeItem('permissions')
        localStorage.removeItem('enabled_modules')
        setAuth({ user: null, permissions: [], enabledModules: [] })
        setAuthed(false)
      })
      .finally(() => setLoading(false))
  },[])

  if(loading) return <div className="p-6">Loading...</div>
  if(!authed) return <Navigate to="/login" replace />
  return children
}
