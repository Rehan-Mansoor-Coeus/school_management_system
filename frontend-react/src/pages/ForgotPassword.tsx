import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, MessageCircle, ShieldCheck, User } from 'lucide-react'
import {
  requestForgotUsername,
  requestPasswordResetOtp,
  resetPassword,
  verifyPasswordResetOtp,
} from '../api/auth'
import { FormField, formInputClass } from '../components/ui/FormField'

type RecoveryMode = 'choose' | 'username' | 'password-phone' | 'password-otp' | 'password-reset'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<RecoveryMode>('choose')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function sendUsername(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await requestForgotUsername(phoneNumber)
      setMessage(res.data.message || 'If an account exists, your username was sent to WhatsApp.')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to send username.')
    } finally {
      setSubmitting(false)
    }
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await requestPasswordResetOtp(phoneNumber)
      setMessage(res.data.message || 'If an account exists, an OTP was sent to WhatsApp.')
      setMode('password-otp')
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
      const res = await verifyPasswordResetOtp(phoneNumber, otp)
      setResetToken(res.data.reset_token)
      setMode('password-reset')
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
      navigate('/admin?reset=success')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  async function resendOtp() {
    setSubmitting(true)
    setError('')
    try {
      const res = await requestPasswordResetOtp(phoneNumber)
      setMessage(res.data.message || 'OTP sent again.')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to resend OTP.')
    } finally {
      setSubmitting(false)
    }
  }

  const title =
    mode === 'username'
      ? 'Forgot username'
      : mode === 'choose'
        ? 'Account recovery'
        : 'Forgot password'

  const subtitle =
    mode === 'username'
      ? 'We will send your username to WhatsApp'
      : mode === 'choose'
        ? 'Recover your username or reset your password'
        : 'Reset your password via WhatsApp OTP'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-rose-50 px-4 py-10">
      <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-rose-600 to-[#1e3a5f] px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              {mode === 'username' ? <User className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-sm text-rose-100">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {message && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {mode === 'choose' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMode('username')
                  setError('')
                  setMessage('')
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:border-[#1e3a5f] hover:bg-white"
              >
                <User className="h-5 w-5 text-[#1e3a5f]" />
                <div>
                  <div className="font-semibold text-slate-900">Forgot username</div>
                  <div className="text-sm text-slate-500">Enter your phone number and receive your username on WhatsApp</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('password-phone')
                  setError('')
                  setMessage('')
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left hover:border-[#1e3a5f] hover:bg-white"
              >
                <KeyRound className="h-5 w-5 text-[#1e3a5f]" />
                <div>
                  <div className="font-semibold text-slate-900">Forgot password</div>
                  <div className="text-sm text-slate-500">Verify your phone with OTP, then set a new password</div>
                </div>
              </button>
            </div>
          )}

          {mode === 'username' && (
            <form onSubmit={sendUsername} className="space-y-4">
              <FormField label="Phone number" required>
                <input
                  required
                  className={formInputClass}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+256700000000"
                  autoComplete="tel"
                />
              </FormField>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" />
                {submitting ? 'Sending…' : 'Send username to WhatsApp'}
              </button>
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Back
              </button>
            </form>
          )}

          {mode === 'password-phone' && (
            <form onSubmit={sendOtp} className="space-y-4">
              <FormField label="Phone number" required>
                <input
                  required
                  className={formInputClass}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+256700000000"
                  autoComplete="tel"
                />
              </FormField>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" />
                {submitting ? 'Sending…' : 'Send WhatsApp OTP'}
              </button>
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Back
              </button>
            </form>
          )}

          {mode === 'password-otp' && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <FormField label="Verification code" required>
                <input
                  required
                  className={formInputClass}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </FormField>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                {submitting ? 'Verifying…' : 'Verify OTP'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={resendOtp}
                className="w-full text-sm font-medium text-[#1e3a5f] hover:underline disabled:opacity-60"
              >
                Resend code
              </button>
            </form>
          )}

          {mode === 'password-reset' && (
            <form onSubmit={submitReset} className="space-y-4">
              <FormField label="New password" required>
                <input
                  type="password"
                  required
                  minLength={8}
                  className={formInputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Confirm password" required>
                <input
                  type="password"
                  required
                  minLength={8}
                  className={formInputClass}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link to="/admin" className="font-medium text-[#1e3a5f] hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
