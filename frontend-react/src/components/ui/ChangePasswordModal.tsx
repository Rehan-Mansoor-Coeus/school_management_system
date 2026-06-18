import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import Modal from './Modal'
import { FormField, formInputClass } from './FormField'
import { changePassword } from '../../api/auth'
import { useToast } from './ToastProvider'

type ChangePasswordModalProps = {
  open: boolean
  onClose: () => void
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { pushToast } = useToast()
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await changePassword(form)
      pushToast('Password changed successfully.', 'success')
      setForm({ current_password: '', password: '', password_confirmation: '' })
      onClose()
    } catch (error: any) {
      const validation = error?.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(' ')
        : null
      pushToast(validation || error?.response?.data?.message || 'Unable to change password', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Change password"
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" form="change-password-form" disabled={submitting} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60">
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </div>
      }
    >
      <form id="change-password-form" onSubmit={submit} className="space-y-4">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f]">
            <Lock className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-600">Choose a strong password with at least 8 characters.</p>
        </div>
        <FormField label="Current password" required>
          <input type="password" required className={formInputClass} value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} />
        </FormField>
        <FormField label="New password" required>
          <input type="password" required minLength={8} className={formInputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </FormField>
        <FormField label="Confirm new password" required>
          <input type="password" required minLength={8} className={formInputClass} value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
        </FormField>
      </form>
    </Modal>
  )
}
