import { useEffect, useMemo, useState } from 'react'
import type { Institution } from '../types'
import { institutionFileUrl } from '../utils'

type BrandField = 'logo' | 'letterhead' | 'footer'

type Props = {
  label: string
  description?: string
  field: BrandField
  accept: string
  institution: Partial<Institution>
  pendingFile?: File | null
  uploading?: boolean
  onChange: (field: BrandField, file: File | null) => void
}

export default function BrandAssetUpload({
  label,
  description,
  field,
  accept,
  institution,
  pendingFile,
  uploading = false,
  onChange,
}: Props) {
  const savedUrl = institutionFileUrl(institution, field)
  const [imageError, setImageError] = useState(false)

  const previewUrl = useMemo(() => {
    if (pendingFile) return URL.createObjectURL(pendingFile)
    return savedUrl
  }, [pendingFile, savedUrl])

  useEffect(() => {
    setImageError(false)
  }, [previewUrl])

  useEffect(() => {
    if (!pendingFile || !previewUrl?.startsWith('blob:')) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [pendingFile, previewUrl])

  const hasStoredPath = Boolean(institution[field])
  const missingOnDisk = hasStoredPath && !savedUrl && !pendingFile

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-1 text-sm font-semibold text-slate-800">{label}</div>
      {description && <p className="mb-3 text-xs leading-relaxed text-slate-500">{description}</p>}

      <div className="mb-3 flex min-h-[6.5rem] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-3">
        {missingOnDisk ? (
          <div className="text-center text-xs text-amber-700">
            <div className="mb-1 font-medium">File missing on server</div>
            <div>Re-upload to restore this asset.</div>
          </div>
        ) : previewUrl && !imageError ? (
          <img
            src={previewUrl}
            alt={label}
            className="max-h-24 max-w-full rounded-lg object-contain"
            onError={() => setImageError(true)}
          />
        ) : previewUrl && imageError ? (
          <div className="text-center text-xs text-amber-700">Preview unavailable — try re-uploading.</div>
        ) : (
          <div className="text-center text-xs text-slate-400">No file uploaded yet</div>
        )}
      </div>

      <input
        type="file"
        accept={accept}
        disabled={uploading}
        onChange={(e) => onChange(field, e.target.files?.[0] || null)}
        className="block w-full text-sm"
      />
      {uploading && <p className="mt-2 text-xs text-slate-500">Uploading…</p>}
      {pendingFile && !uploading && !institution.id && (
        <p className="mt-2 text-xs text-amber-700">Save the institution first to upload this file.</p>
      )}
    </div>
  )
}
