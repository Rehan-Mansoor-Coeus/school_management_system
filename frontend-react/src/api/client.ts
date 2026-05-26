import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api',
})

const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export default api
