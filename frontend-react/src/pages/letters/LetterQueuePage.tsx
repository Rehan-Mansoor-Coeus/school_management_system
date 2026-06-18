import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  approveLetter, bulkLetterAction, deleteLetter, fetchLetters, forwardLetter,
  previewLetter as fetchLetterPreview, rejectLetter, sendLetter, signLetter,
} from '../../api/letters'
import LetterActionDropdown from '../../components/letters/LetterActionDropdown'
import {
  A4Preview, DangerButton, LettersCard, LettersPageHeader, PrimaryButton,
  SecondaryButton, StatusBadge, SuccessButton, TextInput,
} from '../../components/letters/LettersUi'
import OtpVerificationModal from '../../components/letters/OtpVerificationModal'
import Modal from '../../components/ui/Modal'
import { useLettersI18n } from '../../hooks/useLettersI18n'
import { useAuth } from '../../context/AuthContext'

type Props = {
  title: string
  status?: string
  statusIn?: string
  allowBulkApprove?: boolean
  allowBulkSign?: boolean
  allowBulkSend?: boolean
  allowPrint?: boolean
  allowDownload?: boolean
}

export default function LetterQueuePage({
  title, status, statusIn, allowBulkApprove, allowBulkSign, allowBulkSend, allowPrint, allowDownload,
}: Props) {
  const { t } = useLettersI18n()
  const { permissions } = useAuth()
  const navigate = useNavigate()
  const [letters, setLetters] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [preview, setPreview] = useState<any>(null)
  const [activeLetter, setActiveLetter] = useState<any>(null)
  const [error, setError] = useState('')
  const [otpModal, setOtpModal] = useState<{ letter: any; action: string } | null>(null)

  const otpActions = ['approve', 'reject', 'sign', 'send']
  const can = (perm: string) => permissions.includes(perm)
  const canEditLetter = (letter: any) =>
    ['draft', 'awaiting_editing', 'awaiting_approval', 'awaiting_signature', 'rejected'].includes(letter.status)
    && (can('edit_letters') || can('edit_awaiting_letters') || can('approve_letters') || can('sign_letters'))

  async function load() {
    const params: any = { search, per_page: 50 }
    if (statusIn) params.status_in = statusIn
    else if (status) params.status = status
    try {
      const res = await fetchLetters(params)
      setLetters(res.data?.data || res.data || [])
      setError('')
      window.dispatchEvent(new Event('letters:refresh-counts'))
    } catch (err: any) {
      setLetters([])
      setError(err?.response?.data?.message || 'Failed to load letters')
    }
  }

  useEffect(() => {
    load()
  }, [status, statusIn, search])

  function toggle(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function confirmBulkDelete() {
    if (!selected.length) return
    const msg = selected.length === 1
      ? 'Delete the selected letter? This cannot be undone.'
      : `Delete ${selected.length} selected letters? This cannot be undone.`
    if (!window.confirm(msg)) return
    bulk('delete')
  }

  function confirmDelete(letter: any) {
    if (!window.confirm(`Delete letter "${letter.reference}"? This cannot be undone.`)) return
    rowAction('delete', letter)
  }

  async function bulk(action: string, extra: any = {}) {
    if (!selected.length) return
    await bulkLetterAction({ action, letter_ids: selected, ...extra })
    setSelected([])
    await load()
  }

  async function rowAction(action: string, letter: any, otp?: string) {
    try {
      const payload = otp ? { otp } : undefined
      if (action === 'approve') await approveLetter(letter.id, payload)
      if (action === 'reject') await rejectLetter(letter.id, payload)
      if (action === 'sign') await signLetter(letter.id, payload)
      if (action === 'send') await sendLetter(letter.id, payload)
      if (action === 'forward-approver') await forwardLetter(letter.id, { to: 'approver' })
      if (action === 'forward-signer') await forwardLetter(letter.id, { to: 'signer' })
      if (action === 'delete') await deleteLetter(letter.id)
      if (action === 'preview') {
        const res = await fetchLetterPreview(letter.id)
        setPreview(res.data.preview)
        setActiveLetter(letter)
        setError('')
        return
      }
      if (action === 'print') navigate(`/letters/print-view/${letter.id}`)
      if (action === 'download') {
        const res = await fetchLetterPreview(letter.id)
        setPreview(res.data.preview)
        setActiveLetter(letter)
        setTimeout(() => window.print(), 300)
        return
      }
      if (activeLetter?.id === letter.id) {
        setPreview(null)
        setActiveLetter(null)
      }
      setError('')
      await load()
    } catch (err: any) {
      if (err?.response?.status === 422 && err?.response?.data?.otp_required && otpActions.includes(action)) {
        setOtpModal({ letter, action })
        return
      }
      setError(err?.response?.data?.message || 'Action failed')
    }
  }

  function okActionForLetter(letter: any) {
    if (letter.status === 'awaiting_editing') return 'forward-approver'
    if (letter.status === 'awaiting_approval') return 'approve'
    if (letter.status === 'awaiting_signature') return 'sign'
    if (letter.status === 'ready_to_send') return 'send'
    return null
  }

  function okLabelForLetter(letter: any) {
    const action = okActionForLetter(letter)
    if (action === 'forward-approver') return 'OK — Send to Approver'
    if (action === 'approve') return 'OK — Approve'
    if (action === 'sign') return 'OK — Sign'
    if (action === 'send') return 'OK — Send via WhatsApp'
    return null
  }

  async function openPreview(letter: any) {
    if (!letter?.id) {
      setError('Invalid letter record.')
      return
    }
    try {
      setError('')
      const res = await fetchLetterPreview(letter.id)
      if (!res.data?.preview) {
        setError('Preview data was not returned.')
        return
      }
      setPreview(res.data.preview)
      setActiveLetter(letter)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load preview')
    }
  }

  function openPrint(letter: any) {
    navigate(`/letters/print-view/${letter.id}`)
  }

  function openEdit(letter: any) {
    setPreview(null)
    setActiveLetter(null)
    navigate(`/letters/edit/${letter.id}`)
  }

  return (
    <div className="space-y-6">
      <LettersPageHeader
        title={title}
        action={
          <div className="flex flex-wrap gap-2">
            {allowBulkApprove && can('approve_letters') && <SuccessButton onClick={() => bulk('approve')}>{t('bulkApprove')}</SuccessButton>}
            {allowBulkSign && can('sign_letters') && <SuccessButton onClick={() => bulk('sign')}>{t('bulkSign')}</SuccessButton>}
            {allowBulkSend && can('send_letters') && <PrimaryButton onClick={() => bulk('send')}>{t('bulkSend')}</PrimaryButton>}
            {allowPrint && selected.length > 0 && <SecondaryButton onClick={() => navigate(`/letters/print-view/${selected[0]}`)}>{t('printLetters')}</SecondaryButton>}
            {can('delete_letters') && <DangerButton onClick={confirmBulkDelete} disabled={!selected.length}>{t('bulkDelete')}</DangerButton>}
          </div>
        }
      />
      {error && <div className="text-sm text-red-600">{error}</div>}

      <LettersCard>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TextInput placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          <Link to="/letters/create"><PrimaryButton>+ {t('createLetter')}</PrimaryButton></Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-3 pr-3"><input type="checkbox" checked={selected.length === letters.length && letters.length > 0} onChange={e => setSelected(e.target.checked ? letters.map(l => l.id) : [])} /></th>
                <th className="py-3 pr-4">{t('recipient')}</th>
                <th className="py-3 pr-4">{t('reference')}</th>
                <th className="py-3 pr-4">{t('category')}</th>
                <th className="py-3 pr-4">{t('subject')}</th>
                <th className="py-3 pr-4">{t('status')}</th>
                <th className="py-3 pr-4">{t('createdBy')}</th>
                <th className="py-3 pr-4">Edited By</th>
                <th className="py-3 pr-4">Approved By</th>
                <th className="py-3 pr-4">Signed By</th>
                <th className="py-3 pr-4">{t('date')}</th>
                <th className="py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {letters.map(letter => (
                <tr key={letter.id} className="border-b align-top transition hover:bg-slate-50/80">
                  <td className="py-3 pr-3" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(letter.id)} onChange={() => toggle(letter.id)} />
                  </td>
                  <td className="cursor-pointer py-3 pr-4" onClick={() => openPreview(letter)}>{letter.recipients?.[0]?.name || letter.author_name || '—'}</td>
                  <td className="cursor-pointer py-3 pr-4 font-mono text-xs" onClick={() => openPreview(letter)}>{letter.reference}</td>
                  <td className="cursor-pointer py-3 pr-4" onClick={() => openPreview(letter)}>
                    <span className="inline-flex items-center gap-2">
                      {letter.category?.color_tag && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: letter.category.color_tag }} />}
                      {letter.category?.name || '—'}
                    </span>
                  </td>
                  <td className="cursor-pointer py-3 pr-4 font-medium text-[#1e3a5f] hover:underline" onClick={() => openPreview(letter)}>{letter.subject}</td>
                  <td className="py-3 pr-4">
                    <button type="button" className="cursor-pointer" onClick={() => openPreview(letter)}>
                      <StatusBadge status={letter.status} />
                    </button>
                  </td>
                  <td className="cursor-pointer py-3 pr-4" onClick={() => openPreview(letter)}>{letter.creator?.name || '—'}</td>
                  <td className="cursor-pointer py-3 pr-4" onClick={() => openPreview(letter)}>{letter.edited_by || letter.updater?.name || '—'}</td>
                  <td className="cursor-pointer py-3 pr-4" onClick={() => openPreview(letter)}>{letter.approved_by || '—'}</td>
                  <td className="cursor-pointer py-3 pr-4" onClick={() => openPreview(letter)}>{letter.signed_by || '—'}</td>
                  <td className="cursor-pointer py-3 pr-4" onClick={() => openPreview(letter)}>{letter.created_at ? new Date(letter.created_at).toLocaleDateString() : '—'}</td>
                  <td className="py-3" onClick={e => e.stopPropagation()}>
                    <LetterActionDropdown
                      letter={letter}
                      onPreview={() => openPreview(letter)}
                      onEdit={() => openEdit(letter)}
                      onForward={() => rowAction('forward-approver', letter)}
                      onPrint={() => openPrint(letter)}
                      onDelete={() => confirmDelete(letter)}
                      onApprove={() => rowAction('approve', letter)}
                      onReject={() => rowAction('reject', letter)}
                      onSign={() => rowAction('sign', letter)}
                      onSend={() => rowAction('send', letter)}
                    />
                  </td>
                </tr>
              ))}
              {!letters.length && (
                <tr><td colSpan={12} className="py-8 text-center text-slate-500">{t('noRecords')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </LettersCard>

      <OtpVerificationModal
        open={!!otpModal}
        onClose={() => setOtpModal(null)}
        module="letter"
        relatedId={otpModal?.letter?.id}
        action={otpModal?.action || 'approve'}
        context={otpModal?.letter?.subject}
        onVerified={(otp) => {
          if (otpModal) rowAction(otpModal.action, otpModal.letter, otp)
          setOtpModal(null)
        }}
      />

      <Modal
        title="Preview"
        open={!!preview}
        onClose={() => { setPreview(null); setActiveLetter(null) }}
        wide
        footer={
          <div className="flex flex-wrap justify-end gap-2 print:hidden">
            {activeLetter && canEditLetter(activeLetter) && (
              <PrimaryButton onClick={() => openEdit(activeLetter)}>Edit Letter</PrimaryButton>
            )}
            {activeLetter && okLabelForLetter(activeLetter) && (
              <SuccessButton onClick={() => {
                const action = okActionForLetter(activeLetter)
                if (action) rowAction(action, activeLetter)
              }}>
                {okLabelForLetter(activeLetter)}
              </SuccessButton>
            )}
            <SecondaryButton onClick={() => window.print()}>{t('printLetters')}</SecondaryButton>
            <SecondaryButton onClick={() => { setPreview(null); setActiveLetter(null) }}>{t('cancel')}</SecondaryButton>
          </div>
        }
      >
        {preview ? <A4Preview preview={preview} /> : null}
      </Modal>
    </div>
  )
}
