import React, { useState } from 'react'
import api from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function LoginPage(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const navigate = useNavigate()

  async function submit(e:React.FormEvent){
    e.preventDefault()
    try{
      const res = await api.post('/auth/login', {email, password})
      const token = res.data.token
      localStorage.setItem('token', token)
      // set auth header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      navigate('/')
    }catch(err:any){
      const data = err?.response?.data
      const validation = data?.errors
        ? Object.values(data.errors).flat().join(' ')
        : null
      setError(
        validation
        || data?.message
        || (err?.message === 'Network Error' ? 'Cannot reach API server. Is Laravel running on port 8000?' : null)
        || 'Login failed'
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="p-6 bg-white rounded shadow w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Sign in</h2>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full mb-2 p-2 border rounded" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full mb-4 p-2 border rounded" />
        <button className="w-full p-2 bg-blue-600 text-white rounded">Sign in</button>
      </form>
    </div>
  )
}
