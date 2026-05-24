import { useState, useEffect, createContext, useContext } from 'react'
import api from '../api/client'

type User = { id: number; name: string; email: string }

const AuthContext = createContext<{user: User | null, setUser: (u: User | null)=>void}>({user:null,setUser:()=>{}})

export function AuthProvider({children}:{children:any}){
  const [user, setUser] = useState<User|null>(null)

  useEffect(()=>{
    api.get('/me').then(r=>setUser(r.data)).catch(()=>setUser(null))
  },[])

  return <AuthContext.Provider value={{user,setUser}}>{children}</AuthContext.Provider>
}

export function useAuth(){
  return useContext(AuthContext)
}
