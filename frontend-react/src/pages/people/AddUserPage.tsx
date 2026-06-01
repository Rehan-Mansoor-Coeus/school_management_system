import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser, fetchRoles } from '../../api/admin'
import { saveUserLetterWorkflow } from '../../api/letters'
import SignaturePad from '../../components/letters/SignaturePad'
import { FieldLabel, PrimaryButton, SecondaryButton, TextInput } from '../../components/letters/LettersUi'
import { useToast } from '../../components/ui/ToastProvider'

export default function AddUserPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([])
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', phone_number: '', additional_phone_number: '', address: '', status: 'active', primary_role: '' as number | '', roles: [] as number[],
  })
  const [letterWorkflow, setLetterWorkflow] = useState({
    can_edit_letters: false,
    can_approve_letters: false,
    can_sign_letters: false,
    editor_signature_data: null as string | null,
    approver_signature_data: null as string | null,
    signer_signature_data: null as string | null,
  })

  useEffect(() => { fetchRoles().then(res => setRoles(res.data || [])).catch(() => {}) }, [])

  const roleOptions = useMemo(() => roles.map(role => ({ id: role.id, label: role.name })), [roles])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      const roleIds = form.primary_role
        ? Array.from(new Set([Number(form.primary_role), ...form.roles.filter(id => id !== Number(form.primary_role))]))
        : form.roles
      const res = await createUser({ ...form, roles: roleIds })
      const userId = res.data?.user?.id
      if (userId && (letterWorkflow.can_edit_letters || letterWorkflow.can_approve_letters || letterWorkflow.can_sign_letters || letterWorkflow.editor_signature_data || letterWorkflow.approver_signature_data || letterWorkflow.signer_signature_data)) {
        await saveUserLetterWorkflow(userId, letterWorkflow)
      }
      pushToast('User created successfully.')
      navigate('/users')
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to create user', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Add User</h1>
          <p className="text-sm text-slate-500">Create a user with phone number and optional letter workflow permissions.</p>
        </div>
        <SecondaryButton onClick={() => navigate('/users')}>Back to list</SecondaryButton>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div><FieldLabel required>Name</FieldLabel><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><FieldLabel>Username</FieldLabel><TextInput value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Optional — used for login" /></div>
          <div><FieldLabel required>Email</FieldLabel><TextInput type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
          <div><FieldLabel required>Password</FieldLabel><TextInput type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
          <div>
            <FieldLabel required>Primary Role</FieldLabel>
            <select value={form.primary_role} onChange={e => setForm({ ...form, primary_role: e.target.value ? Number(e.target.value) : '' })} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="">Select role</option>
              {roleOptions.map(role => <option key={role.id} value={role.id}>{role.label}</option>)}
            </select>
          </div>
          <div><FieldLabel required>Phone Number</FieldLabel><TextInput value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} required /></div>
          <div><FieldLabel>Additional Phone Number</FieldLabel><TextInput value={form.additional_phone_number} onChange={e => setForm({ ...form, additional_phone_number: e.target.value })} /></div>
          <div className="md:col-span-2"><FieldLabel>Address</FieldLabel><TextInput value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div>
            <FieldLabel>Additional Roles</FieldLabel>
            <select multiple value={form.roles.map(String)} onChange={e => setForm({ ...form, roles: Array.from(e.target.selectedOptions, o => Number(o.value)) })} className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              {roleOptions.map(role => <option key={role.id} value={role.id}>{role.label}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-800">Letters & Announcements Workflow</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={letterWorkflow.can_edit_letters} onChange={e => setLetterWorkflow(p => ({ ...p, can_edit_letters: e.target.checked }))} />Can Edit Letters</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={letterWorkflow.can_approve_letters} onChange={e => setLetterWorkflow(p => ({ ...p, can_approve_letters: e.target.checked }))} />Can Approve Letters</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={letterWorkflow.can_sign_letters} onChange={e => setLetterWorkflow(p => ({ ...p, can_sign_letters: e.target.checked }))} />Can Sign Letters</label>
            </div>
            <div className="mt-4 grid gap-4">
              {letterWorkflow.can_edit_letters && <SignaturePad label="Editor Signature Pad" onConfirm={dataUrl => setLetterWorkflow(p => ({ ...p, editor_signature_data: dataUrl }))} />}
              {letterWorkflow.can_approve_letters && <SignaturePad label="Approver Signature Pad" onConfirm={dataUrl => setLetterWorkflow(p => ({ ...p, approver_signature_data: dataUrl }))} />}
              {letterWorkflow.can_sign_letters && <SignaturePad label="Signer Signature Pad" onConfirm={dataUrl => setLetterWorkflow(p => ({ ...p, signer_signature_data: dataUrl }))} />}
            </div>
          </div>

          <div className="md:col-span-2 flex gap-3">
            <PrimaryButton type="submit">Submit</PrimaryButton>
            <SecondaryButton type="button" onClick={() => navigate('/users')}>Cancel</SecondaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}
