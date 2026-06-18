import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, ShieldAlert } from 'lucide-react'
import { verifyDocument } from '../api/contracts'

export default function DocumentVerifyPage() {
  const { code } = useParams<{ code: string }>()
  const [loading, setLoading] = useState(true)
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!code) return
      setLoading(true)
      try {
        setDoc(await verifyDocument(code))
      } catch {
        setDoc(null)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [code])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {loading ? (
          <p className="text-center text-sm text-slate-500">Verifying…</p>
        ) : doc ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
            <h1 className="text-lg font-bold text-slate-900">Document Verified</h1>
            <div className="mt-4 space-y-1 text-left text-sm text-slate-600">
              <p><span className="font-medium text-slate-800">Reference:</span> {String(doc.reference_number)}</p>
              <p><span className="font-medium text-slate-800">Title:</span> {String(doc.title)}</p>
              <p><span className="font-medium text-slate-800">Recipient:</span> {String(doc.recipient_name)}</p>
              <p className="capitalize"><span className="font-medium text-slate-800">Status:</span> {String(doc.status).replace(/_/g, ' ')}</p>
              {doc.is_executed ? (
                <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">This is a genuine, fully executed document.</p>
              ) : (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">This document exists but is not yet fully executed.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-red-500" />
            <h1 className="text-lg font-bold text-slate-900">Not Found</h1>
            <p className="mt-2 text-sm text-slate-600">No document matches this verification code.</p>
          </div>
        )}
      </div>
    </div>
  )
}
