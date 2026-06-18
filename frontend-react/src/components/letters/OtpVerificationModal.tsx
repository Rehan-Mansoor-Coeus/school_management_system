import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { PrimaryButton, SecondaryButton, TextInput } from './LettersUi'
import { requestOtp, verifyOtp } from '../../api/letters'

type Props = {
  open: boolean
  onClose: () => void
  module: 'letter' | 'announcement'
  relatedId?: number
  action: string
  context?: string
  onVerified: (otp: string) => void
}

export default function OtpVerificationModal({
  open,
  onClose,
  module,
  relatedId,
  action,
  context,
  onVerified,
}: Props) {
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setOtp('')
    setError('')
    setMessage('')
    requestCode()
  }, [open, module, relatedId, action])

  async function requestCode() {
    setBusy(true)
    setError('')
    try {
      const res = await requestOtp({ module, related_id: relatedId, action, context })
      if (res.data?.otp_required === false) {
        onVerified('')
        onClose()
        return
      }
      setMessage(res.data?.message || 'OTP sent to your WhatsApp number.')
      setExpiresAt(res.data?.expires_at || null)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to send OTP.')
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    if (!otp.trim()) {
      setError('Enter the OTP code.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await verifyOtp({ module, related_id: relatedId, action, otp: otp.trim() })
      onVerified(otp.trim())
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="WhatsApp OTP Verification"
      open={open}
      onClose={onClose}
      footer={(
        <div className="flex justify-end gap-2">
          <SecondaryButton type="button" onClick={requestCode} disabled={busy}>
            Resend OTP
          </SecondaryButton>
          <PrimaryButton type="button" onClick={submit} disabled={busy}>
            Verify & Continue
          </PrimaryButton>
        </div>
      )}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          A verification code has been sent to your WhatsApp number for <strong>{action.replace(/_/g, ' ')}</strong>.
        </p>
        {message && <div className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">{message}</div>}
        {expiresAt && <div className="text-xs text-slate-500">Expires: {new Date(expiresAt).toLocaleString()}</div>}
        {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        <TextInput
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          className="text-center text-lg tracking-widest"
        />
      </div>
    </Modal>
  )
}
