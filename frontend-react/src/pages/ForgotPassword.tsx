import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, MessageCircle, ShieldCheck } from 'lucide-react'
import { requestPasswordResetOtp, resetPassword, verifyPasswordResetOtp } from '../api/auth'
import { FormField, formInputClass } from '../components/ui/FormField'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'login' | 'otp' | 'reset'>('login')
  const [login, setLogin] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await requestPasswordResetOtp(login)
      setMessage(res.data.message || 'If an account exists, an OTP was sent.')
      setStep('otp')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to send OTP.')
    } finally {
      setSubmitting(false)
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await verifyPasswordResetOtp(login, otp)
      setResetToken(res.data.reset_token)
      setStep('reset')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await resetPassword({
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation,
      })
      navigate('/login')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-rose-50 px-4 py-10">
      <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-rose-600 to-[#1e3a5f] px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Forgot password</h1>
              <p className="text-sm text-rose-100">Reset via WhatsApp OTP</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
          {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          {step === 'login' && (
            <form onSubmit={sendOtp} className="space-y-4">
              <FormField label="Email, username, or phone" required>
                <input required className={formInputClass} value={login} onChange={(e) => setLogin(e.target.value)} />
              </FormField>
              <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60">
                <MessageCircle className="h-4 w-4" />
                {submitting ? 'Sending…' : 'Send WhatsApp OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <FormField label="Verification code" required>
                <input required className={formInputClass} value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
              </FormField>
              <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                <ShieldCheck className="h-4 w-4" />
                {submitting ? 'Verifying…' : 'Verify OTP'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={submitReset} className="space-y-4">
              <FormField label="New password" required>
                <input type="password" required minLength={8} className={formInputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
              </FormField>
              <FormField label="Confirm password" required>
                <input type="password" required minLength={8} className={formInputClass} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
              </FormField>
              <button type="submit" disabled={submitting} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                {submitting ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-[#1e3a5f] hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
