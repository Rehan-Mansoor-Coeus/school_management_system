import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { previewLetter } from '../../api/letters'
import { A4Preview, PrimaryButton, SecondaryButton } from '../../components/letters/LettersUi'

export default function LetterPrintPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    previewLetter(Number(id)).then(res => setPreview(res.data.preview)).catch(() => navigate(-1))
  }, [id, navigate])

  return (
    <div className="space-y-4 bg-slate-100 p-4 print:bg-white print:p-0">
      <div className="mx-auto flex max-w-[210mm] justify-between print:hidden">
        <SecondaryButton onClick={() => navigate(-1)}>Back</SecondaryButton>
        <PrimaryButton onClick={() => window.print()}>Print</PrimaryButton>
      </div>
      {preview && <A4Preview preview={preview} printMode />}
    </div>
  )
}
