import { useEffect, useRef, useState } from 'react'
import { PrimaryButton, SecondaryButton } from './LettersUi'

type Props = {
  label: string
  value?: string | null
  onConfirm: (dataUrl: string) => void
}

export default function SignaturePad({ label, value, onConfirm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [confirmed, setConfirmed] = useState<string | null>(value || null)

  useEffect(() => {
    setConfirmed(value || null)
  }, [value])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111827'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  function pointFromEvent(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      if (!touch) return null
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
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
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 text-sm font-semibold text-slate-800">{label}</div>
      <p className="mb-3 text-xs text-slate-500">Click below to sign with your mouse or touch.</p>
      <canvas
        ref={canvasRef}
        width={420}
        height={160}
        className="w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <SecondaryButton type="button" onClick={clearPad}>Clear</SecondaryButton>
        <PrimaryButton type="button" onClick={confirmSignature}>Confirm Signature</PrimaryButton>
      </div>
      {confirmed && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">Saved signature preview</div>
          <img src={confirmed} alt={`${label} preview`} className="h-16 object-contain" />
        </div>
      )}
    </div>
  )
}
