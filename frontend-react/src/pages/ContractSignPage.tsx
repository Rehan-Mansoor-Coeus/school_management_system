import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, Check, Eraser, PenLine, Upload, X } from 'lucide-react'
import {
  fetchPublicContractSign,
  formatContractError,
  submitPublicContractSign,
  uploadPublicContractDocument,
} from '../api/contracts'
import { useToast } from '../components/ui/ToastProvider'

type SignerField = { key: string; label: string; required?: boolean }
type RequiredDoc = { key: string; label: string }

function parseContractSections(html: string) {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html
  const sections = wrapper.querySelectorAll('.contract-section')
  if (sections.length) {
    return Array.from(sections).map((el, index) => ({
      number: index + 1,
      title: el.querySelector('h3')?.textContent || `Section ${index + 1}`,
      html: el.innerHTML.replace(/<h3[^>]*>.*?<\/h3>/i, ''),
    }))
  }
  return [{ number: 1, title: 'Contract Terms', html }]
}

export default function ContractSignPage() {
  const { token } = useParams<{ token: string }>()
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null)
  const [signerFields, setSignerFields] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [showSignModal, setShowSignModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    const load = async () => {
      if (!token) return
      setLoading(true)
      try {
        const data = await fetchPublicContractSign(token)
        setPayload(data)
        const existing = (data.contract as { signer_data?: Record<string, string> })?.signer_data || {}
        setSignerFields(existing)
      } catch (error) {
        pushToast(formatContractError(error, 'Invalid or expired signing link'), 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, pushToast])

  useEffect(() => {
    if (!showSignModal) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111827'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [showSignModal])

  function pointFromEvent(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      if (!touch) return null
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    const point = pointFromEvent(e)
    if (!ctx || !point) return
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    const point = pointFromEvent(e)
    if (!ctx || !point) return
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  function stopDraw() { drawing.current = false }

  function clearSignature() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function confirmSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    setSignature(canvas.toDataURL('image/png'))
    setShowSignModal(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, doc: RequiredDoc) {
    if (!token || !e.target.files?.[0]) return
    const formData = new FormData()
    formData.append('token', token)
    formData.append('document_type', doc.key)
    formData.append('label', doc.label)
    formData.append('file', e.target.files[0])
    try {
      const result = await uploadPublicContractDocument(formData)
      if (!result.success) {
        pushToast(result.message || 'Upload failed', 'error')
        return
      }
      setUploadedDocs((prev) => [...prev, doc.label])
      pushToast(`${doc.label} uploaded.`)
    } catch (error) {
      pushToast(formatContractError(error, 'Upload failed'), 'error')
    }
  }

  async function handleSubmit() {
    if (!token || !signature) {
      pushToast('Please add your signature.', 'error')
      return
    }
    if (!agreed) {
      pushToast('Please confirm you agree to the contract terms.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const result = await submitPublicContractSign({
        token,
        signature_data: signature,
        signer_fields: signerFields,
        agreed: true,
      })
      if (!result.success) {
        pushToast(result.message || 'Submission failed', 'error')
        return
      }
      pushToast('Contract signed and submitted for approval.')
      setPayload((prev) => prev ? { ...prev, contract: { ...(prev.contract as object), status: 'pending_approval' } } : prev)
    } catch (error) {
      pushToast(formatContractError(error, 'Submission failed'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1628] text-white">
        <p className="text-sm text-blue-200">Loading contract…</p>
      </div>
    )
  }

  if (!payload?.contract) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1628] px-4 text-white">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-[#111f35] p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <h1 className="text-lg font-semibold">Link Unavailable</h1>
          <p className="mt-2 text-sm text-blue-200">This signing link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  const contract = payload.contract as Record<string, unknown>
  const institutionName = String(payload.institution_name || 'Institution')
  const fields = (payload.signer_fields as SignerField[]) || []
  const requiredDocs = (payload.required_documents as RequiredDoc[]) || []
  const sections = parseContractSections(String(contract.body_html || ''))
  const alreadySigned = ['signed', 'pending_approval', 'approved', 'fully_executed'].includes(String(contract.status))

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 border-l-4 border-[#eab308] pl-4">
          <p className="text-xs uppercase tracking-widest text-blue-300">{institutionName}</p>
          <h1 className="mt-1 text-2xl font-bold text-[#eab308]">{String(contract.title)}</h1>
          <p className="mt-2 text-sm text-blue-100">
            Reference: {String(contract.reference_number)} · Please review all sections carefully before signing.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.number} className="rounded-xl border border-[#2a4a73] bg-[#111f35] p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eab308] text-sm font-bold text-[#0a1628]">{section.number}</span>
                <h2 className="text-base font-semibold text-[#eab308]">{section.title}</h2>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-blue-50" dangerouslySetInnerHTML={{ __html: section.html }} />
            </div>
          ))}
        </div>

        {fields.length > 0 && !alreadySigned && (
          <div className="mt-8 rounded-xl border border-[#2a4a73] bg-[#111f35] p-5">
            <h2 className="mb-4 text-base font-semibold text-[#eab308]">Complete Your Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-xs text-blue-200">
                    {field.label}{field.required ? ' *' : ''}
                  </label>
                  <input
                    required={field.required}
                    value={signerFields[field.key] || ''}
                    onChange={(e) => setSignerFields({ ...signerFields, [field.key]: e.target.value })}
                    className="w-full rounded-lg border border-[#2a4a73] bg-[#0a1628] px-3 py-2 text-sm text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {requiredDocs.length > 0 && !alreadySigned && (
          <div className="mt-8 rounded-xl border border-[#2a4a73] bg-[#111f35] p-5">
            <h2 className="mb-4 text-base font-semibold text-[#eab308]">Supporting Documents</h2>
            <p className="mb-4 text-xs text-blue-200">Accepted formats: PDF, JPG, JPEG, PNG</p>
            <div className="space-y-3">
              {requiredDocs.map((doc) => (
                <label key={doc.key} className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-[#2a4a73] px-4 py-3 hover:border-[#eab308]">
                  <span className="flex items-center gap-2 text-sm">
                    <Upload className="h-4 w-4 text-[#eab308]" />
                    {doc.label}
                    {uploadedDocs.includes(doc.label) && <Check className="h-4 w-4 text-emerald-400" />}
                  </span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => handleUpload(e, doc)} />
                  <span className="text-xs text-blue-300">Upload</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {!alreadySigned && (
          <div className="mt-8 rounded-xl border border-[#2a4a73] bg-white p-5 text-slate-900">
            <h2 className="text-base font-semibold text-slate-900">Digital Signature</h2>

            {!signature ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Signature Required</p>
                    <p className="mt-1 text-xs text-amber-800">A digital signature is required to complete this contract.</p>
                    <button
                      type="button"
                      onClick={() => setShowSignModal(true)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      <PenLine className="h-3.5 w-3.5" />
                      Add Signature
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-emerald-700">Signature confirmed</p>
                <img src={signature} alt="Your signature" className="h-16 object-contain" />
              </div>
            )}

            <label className="mt-4 flex items-start gap-2 text-sm">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
              <span>
                I have read and agree to the <strong>{String(contract.title)}</strong> and confirm that all information provided is accurate.
              </span>
            </label>

            <button
              type="button"
              disabled={submitting || !signature || !agreed}
              onClick={handleSubmit}
              className="mt-4 w-full rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit for Approval'}
            </button>
          </div>
        )}

        {alreadySigned && (
          <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-6 text-center">
            <Check className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
            <h2 className="text-lg font-semibold text-emerald-300">Contract Submitted</h2>
            <p className="mt-2 text-sm text-blue-200">Your signed contract has been submitted and is pending institutional approval.</p>
          </div>
        )}
      </div>

      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1e3a5f]">Sign Your Agreement</h3>
                <p className="text-xs text-slate-500">Draw your signature using your mouse, trackpad, or touchscreen</p>
              </div>
              <button type="button" onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={480}
              height={180}
              className="w-full touch-none rounded-xl border-2 border-slate-200 bg-white"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowSignModal(false)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <X className="h-4 w-4" /> Cancel
              </button>
              <button type="button" onClick={clearSignature} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <Eraser className="h-4 w-4" /> Clear
              </button>
              <button type="button" onClick={confirmSignature} className="inline-flex items-center gap-1 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">
                <Check className="h-4 w-4" /> Confirm Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
