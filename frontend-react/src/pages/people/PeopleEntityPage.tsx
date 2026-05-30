import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { createPerson, deletePerson, fetchPeople, type PeopleEntity, type PeopleRecord, updatePerson } from '../../api/people'
import { FieldLabel, PrimaryButton, SecondaryButton, TextInput } from '../../components/letters/LettersUi'
import { useToast } from '../../components/ui/ToastProvider'

const labels: Record<PeopleEntity, { singular: string; plural: string; listPath: string; addPath: string }> = {
  customers: { singular: 'Customer', plural: 'Customers', listPath: '/people/customers', addPath: '/people/customers/add' },
  billers: { singular: 'Biller', plural: 'Billers', listPath: '/people/billers', addPath: '/people/billers/add' },
  suppliers: { singular: 'Supplier', plural: 'Suppliers', listPath: '/people/suppliers', addPath: '/people/suppliers/add' },
}

export default function PeopleEntityPage() {
  const { entity = 'customers' } = useParams<{ entity: PeopleEntity }>()
  const location = useLocation()
  const isAddRoute = location.pathname.endsWith('/add')
  const typedEntity = (entity in labels ? entity : 'customers') as PeopleEntity
  const meta = labels[typedEntity]
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<PeopleRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<PeopleRecord | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', phone_number: '', additional_phone_number: '', address: '', status: 'active',
  })

  const isForm = isAddRoute || !!editing

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
    if (isAddRoute) {
      setEditing(null)
      setForm({ name: '', email: '', phone_number: '', additional_phone_number: '', address: '', status: 'active' })
    }
  }, [isAddRoute, typedEntity])

  const title = useMemo(() => (isForm ? (editing ? `Edit ${meta.singular}` : `Add ${meta.singular}`) : `${meta.plural} List`), [isForm, editing, meta])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await updatePerson(typedEntity, editing.id, form)
        pushToast(`${meta.singular} updated.`)
      } else {
        await createPerson(typedEntity, form)
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <div><FieldLabel required>Name</FieldLabel><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><FieldLabel>Email</FieldLabel><TextInput type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><FieldLabel required>Phone Number</FieldLabel><TextInput value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} required /></div>
            <div><FieldLabel>Additional Phone Number</FieldLabel><TextInput value={form.additional_phone_number} onChange={e => setForm({ ...form, additional_phone_number: e.target.value })} /></div>
            <div className="md:col-span-2"><FieldLabel>Address</FieldLabel><TextInput value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <PrimaryButton type="submit">Save</PrimaryButton>
              <SecondaryButton type="button" onClick={() => navigate(meta.listPath)}>Cancel</SecondaryButton>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f]">{title}</h1>
          <p className="text-sm text-slate-500">Search, create, edit, and deactivate {meta.plural.toLowerCase()}.</p>
        </div>
        <Link to={meta.addPath} className="inline-flex rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a]">+ Add {meta.singular}</Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 max-w-md"><TextInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or phone..." /></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-3 pr-4">Name</th><th className="py-3 pr-4">Email</th><th className="py-3 pr-4">Phone</th><th className="py-3 pr-4">Status</th><th className="py-3">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading...</td></tr> : items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 pr-4 font-semibold">{item.name}</td>
                  <td className="py-3 pr-4">{item.email || '—'}</td>
                  <td className="py-3 pr-4">{item.phone_number}</td>
                  <td className="py-3 pr-4 capitalize">{item.status}</td>
                  <td className="py-3">
                    <button className="mr-2 rounded-xl bg-slate-100 px-3 py-1 text-slate-700" onClick={() => { setEditing(item); setForm({ name: item.name, email: item.email || '', phone_number: item.phone_number, additional_phone_number: item.additional_phone_number || '', address: item.address || '', status: item.status }) }}>Edit</button>
                    <button className="rounded-xl bg-rose-100 px-3 py-1 text-rose-700" onClick={() => deactivate(item)}>Deactivate</button>
                  </td>
                </tr>
              ))}
              {!loading && !items.length && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
