import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/ToastProvider'
import { createUser, deleteUser, fetchRoles, fetchUsers, updateUser } from '../api/admin'

interface Role {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  email: string
  is_active?: boolean
  roles: Role[]
}

interface RoleUsersPageProps {
  role: string
  title: string
  subtitle: string
}

export default function RoleUsersPage({ role, title, subtitle }: RoleUsersPageProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const { pushToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const roleId = useMemo(() => roles.find((item) => item.name === role)?.id, [roles, role])

  const filteredUsers = useMemo(
    () => users.filter((user) => user.roles.some((item) => item.name === role)),
    [users, role]
  )

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes] = await Promise.all([fetchUsers(), fetchRoles()])
      setUsers(usersRes.data)
      setRoles(rolesRes.data)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || `Failed to load ${title.toLowerCase()}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setActiveUser(null)
    setForm({ name: '', email: '', password: '' })
    setModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setActiveUser(user)
    setForm({ name: user.name, email: user.email, password: '' })
    setModalOpen(true)
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!roleId) {
      pushToast(`The "${role}" role does not exist. Please seed roles first.`, 'error')
      return
    }
    try {
      if (activeUser) {
        const existingRoleIds = activeUser.roles.map((item) => item.id)
        const roleIds = existingRoleIds.includes(roleId) ? existingRoleIds : [...existingRoleIds, roleId]
        await updateUser(activeUser.id, { ...form, roles: roleIds })
        pushToast(`${title.replace(/s$/, '')} updated successfully.`)
      } else {
        await createUser({ ...form, roles: [roleId] })
        pushToast(`${title.replace(/s$/, '')} created successfully.`)
      }
      setModalOpen(false)
      loadData()
    } catch (error: any) {
      const validation = error?.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(' ')
        : null
      pushToast(validation || error?.response?.data?.message || 'Unable to save record', 'error')
    }
  }

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Delete ${user.name}?`)) return
    try {
      await deleteUser(user.id)
      pushToast('Deleted successfully.')
      loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to delete record', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700">
          New {title.replace(/s$/, '').toLowerCase()}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Email</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  Loading {title.toLowerCase()}...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  No {title.toLowerCase()} found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.is_active === false ? 'Inactive' : 'Active'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openEditModal(user)} className="rounded-xl bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(user)} className="rounded-xl bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200">
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
        title={activeUser ? `Edit ${title.replace(/s$/, '').toLowerCase()}` : `Create ${title.replace(/s$/, '').toLowerCase()}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" form="role-user-form" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save
            </button>
          </div>
        }
      >
        <form id="role-user-form" onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              type="password"
              placeholder={activeUser ? 'Leave blank to keep current password' : ''}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              {...(!activeUser ? { required: true } : {})}
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
