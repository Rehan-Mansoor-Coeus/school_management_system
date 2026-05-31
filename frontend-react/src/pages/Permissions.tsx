import React, { useEffect, useState } from 'react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/ToastProvider'
import { createPermission, deletePermission, fetchPermissions, updatePermission } from '../api/admin'

interface Permission {
  id: number
  name: string
}

export default function PermissionsPage() {
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [activePermission, setActivePermission] = useState<Permission | null>(null)
  const [form, setForm] = useState({ name: '' })
  const { pushToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetchPermissions()
      setPermissions(response.data)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load permissions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setActivePermission(null)
    setForm({ name: '' })
    setModalOpen(true)
  }

  const openEditModal = (permission: Permission) => {
    setActivePermission(permission)
    setForm({ name: permission.name })
    setModalOpen(true)
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (activePermission) {
        await updatePermission(activePermission.id, form)
        pushToast('Permission updated successfully.')
      } else {
        await createPermission(form)
        pushToast('Permission created successfully.')
      }
      setModalOpen(false)
      loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to save permission', 'error')
    }
  }

  const handleDelete = async (permission: Permission) => {
    if (!window.confirm('Delete this permission?')) return
    try {
      await deletePermission(permission.id)
      pushToast('Permission deleted successfully.')
      loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to delete permission', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Permissions</h2>
          <p className="text-sm text-slate-500">Create and manage application permissions.</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700">
          New permission
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Permission</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={2} className="px-6 py-10 text-center text-slate-500">
                  Loading permissions...
                </td>
              </tr>
            ) : permissions.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-10 text-center text-slate-500">
                  No permissions found.
                </td>
              </tr>
            ) : (
              permissions.map((permission) => (
                <tr key={permission.id}>
                  <td className="px-6 py-4 text-sm text-slate-900">{permission.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openEditModal(permission)} className="rounded-xl bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(permission)} className="rounded-xl bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={activePermission ? 'Edit Permission' : 'Create Permission'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" form="permission-form" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save
            </button>
          </div>
        }
      >
        <form id="permission-form" onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ name: event.target.value })}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
