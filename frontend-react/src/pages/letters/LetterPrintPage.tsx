import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { previewLetter } from '../../api/letters'
import { A4Preview, PrimaryButton, SecondaryButton } from '../../components/letters/LettersUi'

export default function LetterPrintPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    previewLetter(Number(id))
      .then(res => {
        if (res.data?.preview) setPreview(res.data.preview)
        else setError('Preview data was not returned.')
      })
      .catch(err => setError(err?.response?.data?.message || 'Unable to load letter preview'))
  }, [id])

  return (
    <div className="space-y-4 bg-slate-100 p-4 print:bg-white print:p-0">
      <div className="no-print mx-auto flex max-w-[210mm] justify-between">
        <SecondaryButton onClick={() => navigate(-1)}>Back</SecondaryButton>
        {preview && <PrimaryButton onClick={() => window.print()}>Print</PrimaryButton>}
      </div>
      {error && <div className="no-print mx-auto max-w-[210mm] text-sm text-red-600">{error}</div>}
      {preview && <A4Preview preview={preview} printMode />}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { margin: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}
