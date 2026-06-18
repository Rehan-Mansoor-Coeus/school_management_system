import { useEffect, useMemo, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { FormField, formInputClass } from '../../../components/ui/FormField'
import { useToast } from '../../../components/ui/ToastProvider'
import { formatHrError } from '../../../api/hr'

type FieldDef = {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select'
  required?: boolean
  options?: Array<{ label: string; value: string | number }>
}

type ColumnDef = {
  key: string
  label: string
  render?: (row: any) => string
}

type Props = {
  title: string
  subtitle: string
  fields: FieldDef[]
  columns: ColumnDef[]
  load: () => Promise<any[]>
  create?: (payload: Record<string, unknown>) => Promise<any>
  update?: (id: number, payload: Record<string, unknown>) => Promise<any>
  remove?: (id: number) => Promise<any>
}

function castValue(field: FieldDef, value: string): string | number {
  if (field.type === 'number') {
    return value === '' ? 0 : Number(value)
  }
  return value
}

export default function HrCrudResourcePage({ title, subtitle, fields, columns, load, create, update, remove }: Props) {
  const { pushToast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<Record<string, string>>(() =>
    fields.reduce((acc, field) => {
      acc[field.key] = ''
      return acc
    }, {} as Record<string, string>),
  )

  const refresh = async () => {
    setLoading(true)
    try {
      setItems(await load())
    } catch (error) {
      pushToast(formatHrError(error, `Failed to load ${title.toLowerCase()}`), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q))
  }, [items, query])

  const openCreate = () => {
    setEditing(null)
    setForm(fields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {} as Record<string, string>))
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setForm(
      fields.reduce((acc, field) => {
        const value = row?.[field.key]
        acc[field.key] = value === null || value === undefined ? '' : String(value)
        return acc
      }, {} as Record<string, string>),
    )
    setModalOpen(true)
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload: Record<string, unknown> = {}
    fields.forEach((field) => {
      payload[field.key] = castValue(field, form[field.key] || '')
    })

    try {
      if (editing && update) {
        await update(Number(editing.id), payload)
        pushToast(`${title} updated.`)
      } else if (!editing && create) {
        await create(payload)
        pushToast(`${title} created.`)
      }
      setModalOpen(false)
      refresh()
    } catch (error) {
      pushToast(formatHrError(error, `Unable to save ${title.toLowerCase()}`), 'error')
    }
  }

  const onDelete = async (row: any) => {
    if (!remove) return
    if (!window.confirm(`Delete this ${title.toLowerCase()} record?`)) return
    try {
      await remove(Number(row.id))
      pushToast(`${title} deleted.`)
      refresh()
    } catch (error) {
      pushToast(formatHrError(error, `Unable to delete ${title.toLowerCase()}`), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search records"
          className={`${formInputClass} max-w-sm`}
        />
        {create ? (
          <button type="button" onClick={openCreate} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">
            Add
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>
              ))}
              {(update || remove) ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">No records found.</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-slate-700">
                    {column.render ? column.render(row) : String(row[column.key] ?? '-')}
                  </td>
                ))}
                {(update || remove) ? (
                  <td className="px-4 py-3">
                    {update ? (
                      <button type="button" onClick={() => openEdit(row)} className="mr-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                        Edit
                      </button>
                    ) : null}
                    {remove ? (
                      <button type="button" onClick={() => onDelete(row)} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700">
                        Delete
                      </button>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? `Edit ${title}` : `Add ${title}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
              Cancel
            </button>
            <button type="submit" form="hr-resource-form" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">
              Save
            </button>
          </div>
        }
      >
        <form id="hr-resource-form" onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <FormField key={field.key} label={field.label} required={field.required} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              {field.type === 'textarea' ? (
                <textarea
                  rows={4}
                  className={formInputClass}
                  value={form[field.key] || ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                />
              ) : field.type === 'select' ? (
                <select
                  className={formInputClass}
                  value={form[field.key] || ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                >
                  <option value="">Select</option>
                  {field.options?.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  required={field.required}
                  className={formInputClass}
                  value={form[field.key] || ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                />
              )}
            </FormField>
          ))}
        </form>
      </Modal>
    </div>
  )
}
