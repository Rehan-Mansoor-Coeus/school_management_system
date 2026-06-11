import { useEffect, useMemo } from 'react'
import type { Institution } from '../types'
import { institutionFileUrl } from '../utils'

type BrandField = 'logo' | 'letterhead' | 'footer'

type Props = {
  label: string
  field: BrandField
  accept: string
  institution: Partial<Institution>
  pendingFile?: File | null
  uploading?: boolean
  onChange: (field: BrandField, file: File | null) => void
}

function isPdfPath(path?: string | null) {
  return Boolean(path && path.toLowerCase().endsWith('.pdf'))
}

export default function BrandAssetUpload({
  label,
  field,
  accept,
  institution,
  pendingFile,
  uploading = false,
  onChange,
}: Props) {
  const savedUrl = institutionFileUrl(institution, field)
  const savedPath = institution[field]

  const previewUrl = useMemo(() => {
    if (pendingFile) return URL.createObjectURL(pendingFile)
    return savedUrl
  }, [pendingFile, savedUrl])

  useEffect(() => {
    if (!pendingFile || !previewUrl?.startsWith('blob:')) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [pendingFile, previewUrl])

  const showPdfLink = pendingFile
    ? pendingFile.type === 'application/pdf'
    : isPdfPath(typeof savedPath === 'string' ? savedPath : null)

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 text-sm font-semibold text-slate-800">{label}</div>

      {(previewUrl || pendingFile || savedUrl) && (
        <div className="mb-3 inline-block rounded-xl border border-slate-200 bg-white p-2">
          {showPdfLink ? (
            previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">
                View PDF
              </a>
            ) : (
              <span className="text-sm text-slate-500">PDF attached</span>
            )
          ) : previewUrl ? (
            <img src={previewUrl} alt={label} className="h-24 max-w-full rounded-lg object-contain" />
          ) : (
            <span className="text-sm text-slate-500">Attached</span>
          )}
        </div>
      )}

      <input
        type="file"
        accept={accept}
        disabled={uploading}
        onChange={(e) => onChange(field, e.target.files?.[0] || null)}
        className="block w-full text-sm"
      />
      {uploading && <p className="mt-2 text-xs text-slate-500">Uploading…</p>}
      {pendingFile && !uploading && !savedUrl && (
        <p className="mt-2 text-xs text-amber-700">Save the institution first to upload this file.</p>
      )}
    </div>
  )
}
