import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QrImage({ value, size = 200 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    let active = true
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (active) setDataUrl(url)
      })
      .catch(() => {
        if (active) setDataUrl('')
      })
    return () => {
      active = false
    }
  }, [value, size])

  if (!dataUrl) {
    return <div className="flex items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400" style={{ width: size, height: size }}>QR</div>
  }

  return <img src={dataUrl} alt="QR code" width={size} height={size} className="rounded-xl" />
}
