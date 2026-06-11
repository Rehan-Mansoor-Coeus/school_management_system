import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, UserPlus } from 'lucide-react'
import {
  completeStudentSignup,
  fetchPublicAuthInstitutions,
  requestSignupOtp,
  verifySignupOtp,
} from '../api/auth'
import { FormField, formInputClass } from '../components/ui/FormField'
import SearchableSelect from '../components/ui/SearchableSelect'

type Institution = { id: number; name: string; code?: string; country?: string }

export default function StudentSignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'details' | 'otp' | 'account'>('details')
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [institutionId, setInstitutionId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [signupToken, setSignupToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPublicAuthInstitutions()
      .then((res) => setInstitutions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setInstitutions([]))
  }, [])

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!institutionId) {
      setError('Please select your institution.')
      return
    }
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError('Please enter your full name, phone number, and email address.')
      return
    }
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const res = await requestSignupOtp(Number(institutionId), phone.trim())
      setMessage(res.data.message || 'OTP sent to your WhatsApp number.')
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
      const res = await verifySignupOtp(Number(institutionId), phone.trim(), otp.trim())
      setSignupToken(res.data.signup_token)
      setStep('account')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid or expired OTP.')
    } finally {
      setSubmitting(false)
    }
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await completeStudentSignup({
        signup_token: signupToken,
        institution_id: Number(institutionId),
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        phone_number: phone.trim(),
      })
      navigate('/admin?signup=success')
    } catch (err: any) {
      const validation = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : null
      setError(validation || err?.response?.data?.message || 'Unable to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4a73] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student sign up</h1>
              <p className="text-sm text-blue-100">Enter your details, verify WhatsApp, then set a password</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          )}
          {message && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
          )}

          {step === 'details' && (
            <form onSubmit={sendOtp} className="space-y-4">
              <FormField label="Institution" required>
                <SearchableSelect
                  value={institutionId}
                  onChange={setInstitutionId}
                  options={institutions.map((row) => ({
                    value: String(row.id),
                    label: row.code ? `${row.name} (${row.code})` : row.name,
                  }))}
                  placeholder="Search institution..."
                />
              </FormField>
              <FormField label="Full name" required>
                <input value={name} onChange={(e) => setName(e.target.value)} className={formInputClass} required />
              </FormField>
              <FormField label="WhatsApp phone number" required>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+256700000000"
                  className={formInputClass}
                  required
                />
              </FormField>
              <FormField label="Email address" required>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={formInputClass} required />
              </FormField>
              <p className="flex items-start gap-2 text-xs text-slate-500">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
                We will send a one-time code to your WhatsApp number. Use the same number when signing in later.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60"
              >
                {submitting ? 'Sending OTP…' : 'Send OTP via WhatsApp'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <p className="text-sm text-slate-600">
                Verifying <strong>{name}</strong> · {phone} · {email}
              </p>
              <FormField label="Verification code" required>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className={formInputClass}
                  required
                />
              </FormField>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? 'Verifying…' : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => setStep('details')} className="w-full text-sm text-slate-600 hover:underline">
                Edit details
              </button>
            </form>
          )}

          {step === 'account' && (
            <form onSubmit={createAccount} className="space-y-4">
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <strong>{name}</strong><br />
                {phone} · {email}
              </p>
              <FormField label="Username" required>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className={formInputClass} required />
              </FormField>
              <FormField label="Password" required>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={formInputClass} required minLength={8} />
              </FormField>
              <FormField label="Confirm password" required>
                <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className={formInputClass} required minLength={8} />
              </FormField>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/admin" className="font-medium text-[#1e3a5f] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
