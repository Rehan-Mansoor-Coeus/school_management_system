import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { GraduationCap, User } from 'lucide-react'
import { createPerson, deletePerson, fetchPeople, type PeopleEntity, type PeopleRecord, updatePerson } from '../../api/people'
import { fetchRoles } from '../../api/admin'
import { PrimaryButton, SecondaryButton } from '../../components/letters/LettersUi'
import { FormField, formInputClass } from '../../components/ui/FormField'
import FormSelect from '../../components/ui/FormSelect'
import { useToast } from '../../components/ui/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import { filterAssignableRoles } from '../../utils/accessControl'

const labels: Record<PeopleEntity, { singular: string; plural: string; listPath: string; addPath: string; supportsRoles?: boolean; defaultRoles?: number[] }> = {
  customers: { singular: 'Customer', plural: 'Customers', listPath: '/users/customers', addPath: '/users/customers/add' },
  students: { singular: 'Student', plural: 'Students', listPath: '/users/students', addPath: '/users/students/add', supportsRoles: true },
  teachers: { singular: 'Teacher', plural: 'Teachers', listPath: '/users/teachers', addPath: '/users/teachers/add', supportsRoles: true },
  staff: { singular: 'Staff Member', plural: 'Staff', listPath: '/users/staff', addPath: '/users/staff/add', supportsRoles: true },
  billers: { singular: 'Biller', plural: 'Billers', listPath: '/people/billers', addPath: '/people/billers/add' },
  suppliers: { singular: 'Supplier', plural: 'Suppliers', listPath: '/people/suppliers', addPath: '/people/suppliers/add' },
}

type PeopleEntityPageProps = {
  fixedEntity?: PeopleEntity
}

export default function PeopleEntityPage({ fixedEntity }: PeopleEntityPageProps = {}) {
  const { entity = 'customers' } = useParams<{ entity: PeopleEntity }>()
  const location = useLocation()
  const isAddRoute = location.pathname.endsWith('/add')
  const typedEntity = (fixedEntity || (entity in labels ? entity : 'customers')) as PeopleEntity
  const meta = labels[typedEntity]
  const { userRoles } = useAuth()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<PeopleRecord[]>([])
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<PeopleRecord | null>(null)
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', phone_number: '', additional_phone_number: '', address: '', status: 'active', roles: [] as number[],
  })

  const isForm = isAddRoute || !!editing
  const isStudent = typedEntity === 'students'
  const roleMap = useMemo(() => Object.fromEntries(roles.map(role => [role.id, role.name])), [roles])
  const assignableRoles = useMemo(() => filterAssignableRoles(roles, userRoles), [roles, userRoles])

  async function load() {
    setLoading(true)
    try {
      const res = await fetchPeople(typedEntity, { search })
      setItems(res.data?.data || res.data || [])
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load records', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (!isForm) load() }, [typedEntity, search, isForm])

  useEffect(() => {
    if (meta.supportsRoles) {
      fetchRoles().then(res => setRoles(res.data || [])).catch(() => {})
    }
  }, [meta.supportsRoles])

  useEffect(() => {
    if (isAddRoute) {
      setEditing(null)
      setForm({ name: '', username: '', email: '', password: '', phone_number: '', additional_phone_number: '', address: '', status: 'active', roles: [] })
    }
  }, [isAddRoute, typedEntity])

  const title = useMemo(() => (isForm ? (editing ? `Edit ${meta.singular}` : `Add ${meta.singular}`) : `${meta.plural} List`), [isForm, editing, meta])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = { ...form, roles: form.roles }
      if (!form.password) delete payload.password
      if (!form.username) delete payload.username
      if (editing) {
        await updatePerson(typedEntity, editing.id, payload)
        pushToast(`${meta.singular} updated.`)
      } else {
        await createPerson(typedEntity, payload)
        pushToast(`${meta.singular} created.`)
      }
      navigate(meta.listPath)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to save record', 'error')
    }
  }

  async function deactivate(record: PeopleRecord) {
    if (!window.confirm(`Deactivate ${record.name}?`)) return
    await deletePerson(typedEntity, record.id)
    pushToast(`${meta.singular} deactivated.`)
    load()
  }

  function roleLabels(record: PeopleRecord) {
    const ids = record.role_ids || record.roles || []
    if (!ids.length) return '—'
    return ids.map(id => roleMap[id] || `#${id}`).join(', ')
  }

  if (isForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a5f]">{title}</h1>
            <p className="text-sm text-slate-500">Fields marked * are required.</p>
          </div>
          <SecondaryButton onClick={() => navigate(meta.listPath)}>Back to list</SecondaryButton>
        </div>

        <form onSubmit={save} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e3a5f] text-white">
                {isStudent ? <GraduationCap className="h-6 w-6" /> : <User className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{meta.singular} profile</p>
                <p className="text-sm text-slate-500">Keep contact and login details up to date.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Name">
                <input className={formInputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </FormField>
              <FormField label="Email">
                <input type="email" className={formInputClass} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </FormField>
              {isStudent && (
                <>
                  <FormField label="Username" hint="Login identifier — separate from email">
                    <input className={formInputClass} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                  </FormField>
                  <FormField label="Password" hint={editing ? 'Leave blank to keep current password' : 'Optional — auto-generated if empty'}>
                    <input type="password" className={formInputClass} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  </FormField>
                </>
              )}
              <FormField label="Phone number" required>
                <input className={formInputClass} value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} required />
              </FormField>
              <FormField label="Additional phone">
                <input className={formInputClass} value={form.additional_phone_number} onChange={e => setForm({ ...form, additional_phone_number: e.target.value })} />
              </FormField>
              <FormField label="Address" className="md:col-span-2">
                <input className={formInputClass} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </FormField>
            </div>

            {meta.supportsRoles && (
              <div className="md:col-span-2">
                <FormField label="Roles">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {assignableRoles.map(role => (
                      <label
                        key={role.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={form.roles.includes(role.id)}
                          onChange={(e) => {
                            const id = role.id
                            setForm({
                              ...form,
                              roles: e.target.checked
                                ? [...form.roles, id]
                                : form.roles.filter(r => r !== id),
                            })
                          }}
                        />
                        {role.name}
                      </label>
                    ))}
                  </div>
                </FormField>
              </div>
            )}

            <div className="max-w-xs">
              <FormField label="Status">
                <FormSelect
                  value={form.status}
                  onChange={(value) => setForm({ ...form, status: value })}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  placeholder="Select status"
                />
              </FormField>
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <PrimaryButton type="submit">Save</PrimaryButton>
              <SecondaryButton type="button" onClick={() => navigate(meta.listPath)}>Cancel</SecondaryButton>
            </div>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link to={meta.addPath} className="inline-flex rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a]">+ Add {meta.singular}</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 max-w-md">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or phone..." className={formInputClass} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Phone</th>
                {meta.supportsRoles && <th className="py-3 pr-4">Roles</th>}
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={meta.supportsRoles ? 6 : 5} className="py-8 text-center text-slate-500">Loading...</td></tr> : items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 pr-4 font-semibold">{item.name}</td>
                  <td className="py-3 pr-4">{item.email || '—'}</td>
                  <td className="py-3 pr-4">{item.phone_number}</td>
                  {meta.supportsRoles && <td className="py-3 pr-4">{roleLabels(item)}</td>}
                  <td className="py-3 pr-4 capitalize">{item.status}</td>
                  <td className="py-3">
                    <button className="mr-2 rounded-xl bg-indigo-100 px-3 py-1 text-indigo-700 hover:bg-indigo-200" onClick={() => {
                      setEditing(item)
                      setForm({
                        name: item.name,
                        username: (item as any).username || '',
                        email: item.email || '',
                        password: '',
                        phone_number: item.phone_number,
                        additional_phone_number: item.additional_phone_number || '',
                        address: item.address || '',
                        status: item.status,
                        roles: item.role_ids || item.roles || [],
                      })
                    }}>Edit</button>
                    <button className="rounded-xl bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200" onClick={() => deactivate(item)}>Deactivate</button>
                  </td>
                </tr>
              ))}
              {!loading && !items.length && <tr><td colSpan={meta.supportsRoles ? 6 : 5} className="py-8 text-center text-slate-500">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
