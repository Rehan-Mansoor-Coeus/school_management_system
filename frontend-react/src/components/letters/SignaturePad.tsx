import { useEffect, useRef, useState } from 'react'
import { PenLine } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from './LettersUi'

type Props = {
  label: string
  value?: string | null
  onConfirm: (dataUrl: string) => void
  compact?: boolean
  collapsible?: boolean
}

export default function SignaturePad({ label, value, onConfirm, compact = false, collapsible = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [confirmed, setConfirmed] = useState<string | null>(value || null)
  const [open, setOpen] = useState(!collapsible)

  const canvasWidth = compact ? 280 : 420
  const canvasHeight = compact ? 72 : 160

  useEffect(() => {
    setConfirmed(value || null)
  }, [value])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !open) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = compact ? 1.5 : 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111827'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [open, compact, canvasWidth, canvasHeight])

  function pointFromEvent(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      if (!touch) return null
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = true
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const point = pointFromEvent(e)
    if (!ctx || !point) return
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const point = pointFromEvent(e)
    if (!ctx || !point) return
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  function stopDraw() {
    drawing.current = false
  }

  function clearPad() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setConfirmed(null)
  }

  function confirmSignature() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    setConfirmed(dataUrl)
    onConfirm(dataUrl)
    if (collapsible) setOpen(false)
  }

  if (collapsible && !open && !confirmed) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="mb-2 text-xs font-semibold text-amber-900">Signature required</p>
        <p className="mb-3 text-xs text-amber-800">A digital signature is required to complete your application.</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
        >
          <PenLine className="h-3.5 w-3.5" />
          Add signature
        </button>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${compact ? 'p-3' : 'p-4'}`}>
      {!collapsible && (
        <>
          <div className={`font-semibold text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}>{label}</div>
          <p className={`text-slate-500 ${compact ? 'mb-2 text-[11px]' : 'mb-3 text-xs'}`}>
            Click below to sign with your mouse or touch.
          </p>
        </>
      )}
      {collapsible && open && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800">{label}</span>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:underline">
            Close
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className={`w-full max-w-xs touch-none rounded-lg border-2 border-dashed border-slate-300 bg-white ${compact ? 'max-h-20' : ''}`}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
        <SecondaryButton type="button" onClick={clearPad}>Clear</SecondaryButton>
        <PrimaryButton type="button" onClick={confirmSignature}>Confirm</PrimaryButton>
      </div>
      {confirmed && (
        <div className={`rounded-lg border border-emerald-200 bg-emerald-50 ${compact ? 'mt-2 p-2' : 'mt-3 p-3'}`}>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Saved</div>
          <img src={confirmed} alt={`${label} preview`} className={`object-contain ${compact ? 'h-10' : 'h-16'}`} />
        </div>
      )}
    </div>
  )
}
