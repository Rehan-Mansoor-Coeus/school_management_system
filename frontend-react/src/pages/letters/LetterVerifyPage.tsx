import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { A4Preview } from '../../components/letters/LettersUi'

const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api'

export default function LetterVerifyPage() {
  const { id } = useParams()
  const [preview, setPreview] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    axios.get(`${apiBase}/letters/public/verify/${id}`)
      .then(res => setPreview(res.data.preview))
      .catch(err => setError(err?.response?.data?.message || 'Letter not found.'))
  }, [id])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-bold text-slate-800">Letter Verification</h1>
          <p className="mt-3 text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!preview) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Loading letter...</div>
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <div className="mx-auto mb-4 max-w-[210mm] text-center text-sm text-slate-600 print:hidden">
        Official letter verification — Reference: <strong>{preview.reference}</strong>
      </div>
      <A4Preview preview={preview} printMode />
    </div>
  )
}
