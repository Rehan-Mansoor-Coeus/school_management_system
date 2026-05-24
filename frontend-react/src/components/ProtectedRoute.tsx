import React from 'react'
import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/client'

export default function ProtectedRoute({children}:{children:JSX.Element}){
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(()=>{
    api.get('/auth/user').then(()=>setAuthed(true)).catch(()=>setAuthed(false)).finally(()=>setLoading(false))
  },[])

  if(loading) return <div className="p-6">Loading...</div>
  if(!authed) return <Navigate to="/login" replace />
  return children
}
