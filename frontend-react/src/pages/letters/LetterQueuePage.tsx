import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  approveLetter, bulkLetterAction, deleteLetter, fetchLetters, forwardLetter,
  previewLetter, rejectLetter, sendLetter, signLetter,
} from '../../api/letters'
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
  const [error, setError] = useState('')
  const [openActionId, setOpenActionId] = useState<number | null>(null)
  const [otpModal, setOtpModal] = useState<{ letter: any; action: string } | null>(null)

  const otpActions = ['approve', 'reject', 'sign', 'send']

  const can = (perm: string) => permissions.includes(perm)

  async function load() {
    const params: any = { search, per_page: 50 }
    if (statusIn) params.status_in = statusIn
    else if (status) params.status = status
    const res = await fetchLetters(params)
    setLetters(res.data?.data || [])
    window.dispatchEvent(new Event('letters:refresh-counts'))
  }

  useEffect(() => {
    load().catch(() => setError('Failed to load letters'))
  }, [status, statusIn, search])

  function toggle(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function bulk(action: string, extra: any = {}) {
    if (!selected.length) return
    await bulkLetterAction({ action, letter_ids: selected, ...extra })
    setSelected([])
    await load()
  }

  async function rowAction(action: string, letter: any, otp?: string) {
    setOpenActionId(null)
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
        const res = await previewLetter(letter.id)
        setPreview(res.data.preview)
      }
      if (action === 'print') navigate(`/letters/print-view/${letter.id}`)
      if (action === 'download') {
        const res = await previewLetter(letter.id)
        setPreview(res.data.preview)
        setTimeout(() => window.print(), 300)
      }
      if (!['preview', 'print', 'download'].includes(action)) await load()
    } catch (err: any) {
      if (err?.response?.status === 422 && err?.response?.data?.otp_required && otpActions.includes(action)) {
        setOtpModal({ letter, action })
        return
      }
      setError(err?.response?.data?.message || 'Action failed')
    }
  }

  function handleRowAction(action: string, letter: any) {
    rowAction(action, letter)
  }

  const actionOptions = useMemo(() => (letter: any) => {
    const options: { key: string; label: string }[] = [{ key: 'preview', label: t('preview') }]
    if (can('edit_letters') || can('edit_awaiting_letters')) options.push({ key: 'edit', label: t('edit') })
    if (letter.status === 'awaiting_editing' && can('forward_letter_to_approver')) options.push({ key: 'forward-approver', label: `${t('forward')} approver` })
    if (letter.status === 'awaiting_approval' && can('approve_letters')) options.push({ key: 'approve', label: t('approve') })
    if (letter.status === 'awaiting_approval' && can('reject_letters')) options.push({ key: 'reject', label: t('reject') })
    if (letter.status === 'awaiting_signature' && can('sign_letters')) options.push({ key: 'sign', label: t('sign') })
    if (letter.status === 'ready_to_send' && can('send_letters')) options.push({ key: 'send', label: t('send') })
    if (allowPrint || ['ready_to_send', 'sent'].includes(letter.status)) options.push({ key: 'print', label: t('printLetters') })
    if (allowDownload || ['ready_to_send', 'sent'].includes(letter.status)) options.push({ key: 'download', label: t('downloadLetters') })
    if (can('delete_letters')) options.push({ key: 'delete', label: t('delete') })
    return options
  }, [permissions, allowPrint, allowDownload, t])

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
            {can('delete_letters') && <DangerButton onClick={() => bulk('delete')}>{t('bulkDelete')}</DangerButton>}
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
                <tr key={letter.id} className="border-b align-top">
                  <td className="py-3 pr-3"><input type="checkbox" checked={selected.includes(letter.id)} onChange={() => toggle(letter.id)} /></td>
                  <td className="py-3 pr-4">{letter.recipients?.[0]?.name || letter.author_name || '—'}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{letter.reference}</td>
                  <td className="py-3 pr-4">{letter.category?.name || '—'}</td>
                  <td className="py-3 pr-4">{letter.subject}</td>
                  <td className="py-3 pr-4"><StatusBadge status={letter.status} /></td>
                  <td className="py-3 pr-4">{letter.creator?.name || '—'}</td>
                  <td className="py-3 pr-4">{letter.edited_by || letter.updater?.name || '—'}</td>
                  <td className="py-3 pr-4">{letter.approved_by || '—'}</td>
                  <td className="py-3 pr-4">{letter.signed_by || '—'}</td>
                  <td className="py-3 pr-4">{letter.created_at ? new Date(letter.created_at).toLocaleDateString() : '—'}</td>
                  <td className="py-3">
                    <div className="relative">
                      <SecondaryButton onClick={() => setOpenActionId(openActionId === letter.id ? null : letter.id)}>{t('actions')} ▾</SecondaryButton>
                      {openActionId === letter.id && (
                        <div className="absolute right-0 z-20 mt-1 min-w-[160px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                          {actionOptions(letter).map(option => (
                            <button
                              key={option.key}
                              type="button"
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                              onClick={() => handleRowAction(option.key, letter)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
        title={t('preview')}
        open={!!preview}
        onClose={() => setPreview(null)}
        wide
        footer={
          <div className="flex justify-end gap-2 print:hidden">
            <SecondaryButton onClick={() => window.print()}>{t('printLetters')}</SecondaryButton>
            <SecondaryButton onClick={() => setPreview(null)}>{t('cancel')}</SecondaryButton>
          </div>
        }
      >
        {preview ? <A4Preview preview={preview} /> : null}
      </Modal>
    </div>
  )
}
